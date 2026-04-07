-- Returns the connection_id for an active portal so the public board-data
-- API route can look up the connected account without exposing the full
-- portals table to anon users.
create or replace function public.get_portal_connection_id(p_portal_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
    select p.connection_id
    from public.portals p
    where p.id = p_portal_id
      and p.status = 'active'
    limit 1;
$$;

revoke all on function public.get_portal_connection_id(uuid) from public;
grant execute on function public.get_portal_connection_id(uuid) to anon, authenticated;
