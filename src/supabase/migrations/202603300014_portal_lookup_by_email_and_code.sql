-- Find portals an email has access to (for email OTP flow without knowing portal_id)
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
  where p.status <> 'archived'
    and p.access_type = 'email_otp'
    and lower(trim(p_email)) = any (
      select lower(trim(e))
      from unnest(p.access_email_allowlist) as e
    )
  order by p.name;
$$;

-- Find a portal by its access code hash (for code flow without knowing portal_id)
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
  where p.status <> 'archived'
    and p.access_type = 'anyone_with_code'
    and p.access_code_hash is not null
    and p.access_code_hash = p_code_hash
  limit 1;
$$;

revoke all on function public.find_portals_by_email(text) from public;
revoke all on function public.find_portal_by_access_code(text) from public;

grant execute on function public.find_portals_by_email(text) to anon, authenticated;
grant execute on function public.find_portal_by_access_code(text) to anon, authenticated;
