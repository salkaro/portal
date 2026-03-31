-- Only active portals are publicly accessible
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
    and p.status = 'active'
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
      and p.status = 'active'
      and p.access_type = 'anyone_with_link'
  );
$$;

create or replace function public.find_portals_by_email(p_email text)
returns table (
  id uuid,
  name text,
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
    p.access_type
  from public.portals p
  where p.status = 'active'
    and p.access_type = 'email_otp'
    and lower(trim(p_email)) = any (
      select lower(trim(e))
      from unnest(p.access_email_allowlist) as e
    )
  order by p.name;
$$;

create or replace function public.find_portal_by_access_code(p_code_hash text)
returns table (
  id uuid,
  name text,
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
    p.access_type
  from public.portals p
  where p.status = 'active'
    and p.access_type = 'anyone_with_code'
    and p.access_code_hash is not null
    and p.access_code_hash = p_code_hash
  limit 1;
$$;
