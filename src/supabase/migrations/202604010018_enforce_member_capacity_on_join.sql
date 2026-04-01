-- Enforce member capacity when joining via invite or org code.
-- If the organisation is at or above its plan member limit, the join is refused
-- with a generic "invalid code" message to avoid leaking capacity info.

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
  v_member_count integer;
  v_member_limit integer;
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

  -- Try invite code first
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

    -- Enforce member capacity based on the org's plan
    v_member_limit := case v_org.subscription
      when 'pro' then 10
      else 2
    end;

    select count(*)
    into v_member_count
    from public.organisation_members om
    where om.organisation_id = v_org.id;

    if v_member_count >= v_member_limit then
      raise exception 'Invalid code';
    end if;

    v_role := case
      when v_invite.role in ('owner', 'admin', 'member') then v_invite.role
      else 'member'
    end;

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

  -- Fall back to org join code
  select o.*
  into v_org
  from public.organisations o
  where o.join_code = v_code
  limit 1;

  if not found then
    raise exception 'Organisation not found for that code';
  end if;

  -- Enforce member capacity
  v_member_limit := case v_org.subscription
    when 'pro' then 10
    else 2
  end;

  select count(*)
  into v_member_count
  from public.organisation_members om
  where om.organisation_id = v_org.id;

  if v_member_count >= v_member_limit then
    raise exception 'Invalid code';
  end if;

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
