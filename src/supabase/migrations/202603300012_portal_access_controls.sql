alter table public.portals
add column if not exists access_type text not null default 'anyone_with_link' check (access_type in ('anyone_with_link', 'email_otp', 'anyone_with_code'));

alter table public.portals
add column if not exists access_email_allowlist text[] not null default '{}'::text[];

alter table public.portals
add column if not exists access_code_hash text;

create table if not exists public.portal_access_otps (
  id uuid primary key default gen_random_uuid(),
  portal_id uuid not null references public.portals(id) on delete cascade,
  email text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists portal_access_otps_portal_email_idx
  on public.portal_access_otps (portal_id, email, created_at desc);

alter table public.portal_access_otps enable row level security;

create or replace function public.get_public_portal_by_id(p_portal_id uuid)
returns table (
  id uuid,
  name text,
  import_config jsonb,
  customization jsonb,
  access_type text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.name,
    p.import_config,
    p.customization,
    p.access_type
  from public.portals p
  where p.id = p_portal_id
    and p.status <> 'archived'
  limit 1;
$$;

create or replace function public.can_access_portal_without_auth(p_portal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.portals p
    where p.id = p_portal_id
      and p.status <> 'archived'
      and p.access_type = 'anyone_with_link'
  );
$$;

create or replace function public.create_portal_email_otp(
  p_portal_id uuid,
  p_email text,
  p_otp_hash text,
  p_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_allowed_emails text[];
  v_access_type text;
begin
  v_email := lower(trim(p_email));

  select p.access_type, p.access_email_allowlist
  into v_access_type, v_allowed_emails
  from public.portals p
  where p.id = p_portal_id
    and p.status <> 'archived'
  limit 1;

  if v_access_type is null then
    raise exception 'Portal not found';
  end if;

  if v_access_type <> 'email_otp' then
    raise exception 'Portal does not allow email access';
  end if;

  if not exists (
    select 1
    from unnest(v_allowed_emails) as allowed_email
    where lower(trim(allowed_email)) = v_email
  ) then
    raise exception 'Email is not allowed for this portal';
  end if;

  insert into public.portal_access_otps (portal_id, email, otp_hash, expires_at)
  values (p_portal_id, v_email, p_otp_hash, p_expires_at);
end;
$$;

create or replace function public.verify_portal_email_otp(
  p_portal_id uuid,
  p_email text,
  p_otp_hash text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_matched boolean;
begin
  update public.portal_access_otps
  set consumed_at = now()
  where id = (
    select otp.id
    from public.portal_access_otps otp
    where otp.portal_id = p_portal_id
      and otp.email = lower(trim(p_email))
      and otp.otp_hash = p_otp_hash
      and otp.consumed_at is null
      and otp.expires_at > now()
    order by otp.created_at desc
    limit 1
  );

  get diagnostics v_matched = row_count;
  return v_matched;
end;
$$;

create or replace function public.verify_portal_access_code(
  p_portal_id uuid,
  p_code_hash text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.portals p
    where p.id = p_portal_id
      and p.status <> 'archived'
      and p.access_type = 'anyone_with_code'
      and p.access_code_hash is not null
      and p.access_code_hash = p_code_hash
  );
$$;

revoke all on function public.get_public_portal_by_id(uuid) from public;
revoke all on function public.can_access_portal_without_auth(uuid) from public;
revoke all on function public.create_portal_email_otp(uuid, text, text, timestamptz) from public;
revoke all on function public.verify_portal_email_otp(uuid, text, text) from public;
revoke all on function public.verify_portal_access_code(uuid, text) from public;

grant execute on function public.get_public_portal_by_id(uuid) to anon, authenticated;
grant execute on function public.can_access_portal_without_auth(uuid) to anon, authenticated;
grant execute on function public.create_portal_email_otp(uuid, text, text, timestamptz) to anon, authenticated;
grant execute on function public.verify_portal_email_otp(uuid, text, text) to anon, authenticated;
grant execute on function public.verify_portal_access_code(uuid, text) to anon, authenticated;
