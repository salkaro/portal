-- Fix recursive RLS checks on organisation_members by moving membership checks
-- into SECURITY DEFINER helper functions.

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
  );
$$;

revoke all on function public.is_member_of_organisation(uuid) from public;
revoke all on function public.is_org_admin_or_owner(uuid) from public;
grant execute on function public.is_member_of_organisation(uuid) to authenticated;
grant execute on function public.is_org_admin_or_owner(uuid) to authenticated;

drop policy if exists "Members can read organisation memberships" on public.organisation_members;
drop policy if exists "Owners and admins can update memberships" on public.organisation_members;
drop policy if exists "Owners and admins can delete memberships" on public.organisation_members;

create policy "Members can read organisation memberships"
  on public.organisation_members
  for select
  to authenticated
  using (public.is_member_of_organisation(organisation_members.organisation_id));

create policy "Owners and admins can update memberships"
  on public.organisation_members
  for update
  to authenticated
  using (
    public.is_org_admin_or_owner(organisation_members.organisation_id)
    and organisation_members.role <> 'owner'
  )
  with check (
    public.is_org_admin_or_owner(organisation_members.organisation_id)
    and organisation_members.role <> 'owner'
  );

create policy "Owners and admins can delete memberships"
  on public.organisation_members
  for delete
  to authenticated
  using (
    public.is_org_admin_or_owner(organisation_members.organisation_id)
    and organisation_members.role <> 'owner'
  );

drop policy if exists "Members can read invites in their organisations" on public.organisation_invites;
drop policy if exists "Owners and admins can create invites" on public.organisation_invites;
drop policy if exists "Owners and admins can update invites" on public.organisation_invites;
drop policy if exists "Owners and admins can delete invites" on public.organisation_invites;

create policy "Members can read invites in their organisations"
  on public.organisation_invites
  for select
  to authenticated
  using (public.is_member_of_organisation(organisation_invites.organisation_id));

create policy "Owners and admins can create invites"
  on public.organisation_invites
  for insert
  to authenticated
  with check (public.is_org_admin_or_owner(organisation_invites.organisation_id));

create policy "Owners and admins can update invites"
  on public.organisation_invites
  for update
  to authenticated
  using (public.is_org_admin_or_owner(organisation_invites.organisation_id))
  with check (public.is_org_admin_or_owner(organisation_invites.organisation_id));

create policy "Owners and admins can delete invites"
  on public.organisation_invites
  for delete
  to authenticated
  using (public.is_org_admin_or_owner(organisation_invites.organisation_id));
