-- Add approval state to organisation members.
-- Members who join via code start as pending (approved = false).
-- Owners always start approved. Admins/owners can approve pending members.

alter table public.organisation_members
  add column if not exists approved boolean not null default true;

-- Update helper: treat unapproved members as non-members for permission checks
-- so pending users cannot read org data, invites, portals etc.
create or replace function public.is_member_of_organisation(p_organisation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organisation_members om
    where om.organisation_id = p_organisation_id
      and om.user_id = auth.uid()
      and om.approved = true
  );
$$;

create or replace function public.is_org_admin_or_owner(p_organisation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organisation_members om
    where om.organisation_id = p_organisation_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
      and om.approved = true
  );
$$;

-- Pending members need to be able to read their OWN row so the app can detect
-- the pending state on login. The existing "Members can read organisation memberships"
-- policy uses is_member_of_organisation which now excludes pending members, so we
-- add a separate self-read policy.
create policy "Users can read their own membership row"
  on public.organisation_members
  for select
  to authenticated
  using (user_id = auth.uid());

-- Allow owners/admins to approve pending members (set approved = true).
-- Reuses the existing update policy which already scopes to is_org_admin_or_owner.

-- Update the join RPC so newly joined-by-code members are pending.
create or replace function public.join_organisation_by_code(p_join_code text)
returns setof public.organisations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_user_email text;
  v_code text;
  v_org public.organisations%rowtype;
  v_invite public.organisation_invites%rowtype;
  v_role text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_code := upper(trim(p_join_code));

  if v_code is null or length(v_code) = 0 then
    raise exception 'Organisation code is required';
  end if;

  select u.email
  into v_user_email
  from auth.users u
  where u.id = v_user_id;

  select i.*
  into v_invite
  from public.organisation_invites i
  where i.code = v_code
    and i.active = true
    and i.uses_left > 0
  limit 1;

  if found then
    if v_invite.email is not null
      and v_user_email is not null
      and lower(v_invite.email) <> lower(v_user_email) then
      raise exception 'This invite code is tied to a different email address';
    end if;

    select o.*
    into v_org
    from public.organisations o
    where o.id = v_invite.organisation_id
    limit 1;

    if not found then
      raise exception 'Organisation not found for that code';
    end if;

    v_role := case
      when v_invite.role in ('owner', 'admin', 'member') then v_invite.role
      else 'member'
    end;

    -- Insert as pending (approved = false); ignore if already a member
    insert into public.organisation_members (organisation_id, user_id, role, approved)
    values (v_org.id, v_user_id, v_role, false)
    on conflict (organisation_id, user_id) do nothing;

    update public.organisation_invites i
    set
      uses_left = greatest(i.uses_left - 1, 0),
      active = case when i.uses_left - 1 <= 0 then false else i.active end
    where i.id = v_invite.id;

    return query
    select o.*
    from public.organisations o
    where o.id = v_org.id;

    return;
  end if;

  select o.*
  into v_org
  from public.organisations o
  where o.join_code = v_code
  limit 1;

  if not found then
    raise exception 'Organisation not found for that code';
  end if;

  -- Insert as pending (approved = false)
  insert into public.organisation_members (organisation_id, user_id, role, approved)
  values (v_org.id, v_user_id, 'member', false)
  on conflict (organisation_id, user_id) do nothing;

  return query
  select o.*
  from public.organisations o
  where o.id = v_org.id;
end;
$$;

revoke all on function public.join_organisation_by_code(text) from public;
grant execute on function public.join_organisation_by_code(text) to authenticated;

-- Update member details lookup to include approved flag
drop function if exists public.get_organisation_members_details(uuid);
create or replace function public.get_organisation_members_details(p_organisation_id uuid)
returns table (
  organisation_id uuid,
  user_id uuid,
  role text,
  approved boolean,
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

  -- Must be an approved member to list the org's members
  if not exists (
    select 1
    from public.organisation_members my
    where my.organisation_id = p_organisation_id
      and my.user_id = auth.uid()
      and my.approved = true
  ) then
    raise exception 'Not authorized to view organisation members';
  end if;

  return query
  select
    om.organisation_id::uuid as organisation_id,
    om.user_id::uuid as user_id,
    om.role::text as role,
    om.approved::boolean as approved,
    om.created_at::timestamptz as created_at,
    coalesce((u.raw_user_meta_data ->> 'full_name'), '')::text as full_name,
    u.email::text as email,
    (u.raw_user_meta_data ->> 'avatar_url')::text as avatar_url
  from public.organisation_members om
  left join auth.users u on u.id = om.user_id
  where om.organisation_id = p_organisation_id
  order by om.approved asc, om.created_at asc;
end;
$$;

revoke all on function public.get_organisation_members_details(uuid) from public;
grant execute on function public.get_organisation_members_details(uuid) to authenticated;
