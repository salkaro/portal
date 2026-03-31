create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon_url text,
  stripe_customer_id text unique,
  subscription text not null default 'free' check (subscription in ('free', 'pro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organisation_members (
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (organisation_id, user_id)
);

alter table public.organisations enable row level security;
alter table public.organisation_members enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists organisations_set_updated_at on public.organisations;
create trigger organisations_set_updated_at
before update on public.organisations
for each row
execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'organisations'
      and policyname = 'Authenticated users can create organisations'
  ) then
    create policy "Authenticated users can create organisations"
      on public.organisations
      for insert
      to authenticated
      with check (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'organisations'
      and policyname = 'Members can read organisations'
  ) then
    create policy "Members can read organisations"
      on public.organisations
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.organisation_members om
          where om.organisation_id = organisations.id
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
    where schemaname = 'public'
      and tablename = 'organisations'
      and policyname = 'Members can update organisations'
  ) then
    create policy "Members can update organisations"
      on public.organisations
      for update
      to authenticated
      using (
        exists (
          select 1
          from public.organisation_members om
          where om.organisation_id = organisations.id
            and om.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.organisation_members om
          where om.organisation_id = organisations.id
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
    where schemaname = 'public'
      and tablename = 'organisation_members'
      and policyname = 'Users can read their own memberships'
  ) then
    create policy "Users can read their own memberships"
      on public.organisation_members
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'organisation_members'
      and policyname = 'Users can insert their own memberships'
  ) then
    create policy "Users can insert their own memberships"
      on public.organisation_members
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'organisation_members'
      and policyname = 'Users can delete their own memberships'
  ) then
    create policy "Users can delete their own memberships"
      on public.organisation_members
      for delete
      to authenticated
      using (user_id = auth.uid());
  end if;
end
$$;
