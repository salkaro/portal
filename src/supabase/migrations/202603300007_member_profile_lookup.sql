create or replace function public.get_organisation_members_details(p_organisation_id uuid)
returns table (
  organisation_id uuid,
  user_id uuid,
  role text,
  created_at timestamptz,
  full_name text,
  email text,
  avatar_url text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.organisation_members my
    where my.organisation_id = p_organisation_id
      and my.user_id = auth.uid()
  ) then
    raise exception 'Not authorized to view organisation members';
  end if;

  return query
  select
    om.organisation_id::uuid as organisation_id,
    om.user_id::uuid as user_id,
    om.role::text as role,
    om.created_at::timestamptz as created_at,
    coalesce((u.raw_user_meta_data ->> 'full_name'), '')::text as full_name,
    u.email::text as email,
    (u.raw_user_meta_data ->> 'avatar_url')::text as avatar_url
  from public.organisation_members om
  left join auth.users u on u.id = om.user_id
  where om.organisation_id = p_organisation_id
  order by om.created_at asc;
end;
$$;

revoke all on function public.get_organisation_members_details(uuid) from public;
grant execute on function public.get_organisation_members_details(uuid) to authenticated;
