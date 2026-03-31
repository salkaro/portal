alter table public.organisations
add column if not exists join_code text;

create or replace function public.generate_join_code()
returns text
language plpgsql
as $$
declare
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
begin
  for i in 1..8 loop
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;

  return result;
end;
$$;

create or replace function public.ensure_organisation_join_code()
returns trigger
language plpgsql
as $$
begin
  if new.join_code is null or length(trim(new.join_code)) = 0 then
    loop
      new.join_code := public.generate_join_code();
      exit when not exists (
        select 1
        from public.organisations o
        where o.join_code = new.join_code
      );
    end loop;
  else
    new.join_code := upper(trim(new.join_code));
  end if;

  return new;
end;
$$;

drop trigger if exists organisations_ensure_join_code on public.organisations;
create trigger organisations_ensure_join_code
before insert or update on public.organisations
for each row
execute function public.ensure_organisation_join_code();

update public.organisations
set join_code = public.generate_join_code()
where join_code is null or length(trim(join_code)) = 0;

create unique index if not exists organisations_join_code_key
on public.organisations (join_code);

create or replace function public.join_organisation_by_code(p_join_code text)
returns setof public.organisations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_org public.organisations%rowtype;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select o.*
  into v_org
  from public.organisations o
  where o.join_code = upper(trim(p_join_code))
  limit 1;

  if not found then
    raise exception 'Organisation not found for that code';
  end if;

  insert into public.organisation_members (organisation_id, user_id, role)
  values (v_org.id, v_user_id, 'member')
  on conflict (organisation_id, user_id) do nothing;

  return query
  select o.*
  from public.organisations o
  where o.id = v_org.id;
end;
$$;

revoke all on function public.join_organisation_by_code(text) from public;
grant execute on function public.join_organisation_by_code(text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'organisation-branding',
  'organisation-branding',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Organisation branding assets are publicly readable'
  ) then
    create policy "Organisation branding assets are publicly readable"
      on storage.objects
      for select
      using (bucket_id = 'organisation-branding');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Organisation members can upload branding assets'
  ) then
    create policy "Organisation members can upload branding assets"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'organisation-branding'
        and exists (
          select 1
          from public.organisation_members om
          where om.organisation_id::text = (storage.foldername(name))[1]
            and om.user_id = auth.uid()
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Organisation members can update branding assets'
  ) then
    create policy "Organisation members can update branding assets"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'organisation-branding'
        and exists (
          select 1
          from public.organisation_members om
          where om.organisation_id::text = (storage.foldername(name))[1]
            and om.user_id = auth.uid()
        )
      )
      with check (
        bucket_id = 'organisation-branding'
        and exists (
          select 1
          from public.organisation_members om
          where om.organisation_id::text = (storage.foldername(name))[1]
            and om.user_id = auth.uid()
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Organisation members can delete branding assets'
  ) then
    create policy "Organisation members can delete branding assets"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'organisation-branding'
        and exists (
          select 1
          from public.organisation_members om
          where om.organisation_id::text = (storage.foldername(name))[1]
            and om.user_id = auth.uid()
        )
      );
  end if;
end
$$;
