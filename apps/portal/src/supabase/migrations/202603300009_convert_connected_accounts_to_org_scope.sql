alter table if exists public.connected_accounts
add column if not exists organisation_id uuid references public.organisations(id) on delete cascade;

alter table if exists public.connected_accounts
add column if not exists created_by uuid references auth.users(id) on delete set null;

-- Backfill organisation_id from the previous user_id-based records.
update public.connected_accounts ca
set organisation_id = om.organisation_id,
    created_by = coalesce(ca.created_by, ca.user_id)
from public.organisation_members om
where ca.organisation_id is null
  and ca.user_id is not null
  and om.user_id = ca.user_id;

-- Remove records that cannot be mapped to an organisation.
delete from public.connected_accounts
where organisation_id is null;

drop index if exists connected_accounts_user_id_idx;
create index if not exists connected_accounts_organisation_id_idx
  on public.connected_accounts (organisation_id);

alter table public.connected_accounts
drop constraint if exists connected_accounts_user_id_provider_key;

alter table public.connected_accounts
add constraint connected_accounts_organisation_id_provider_key
unique (organisation_id, provider);

-- Drop legacy user-scoped policies before dropping user_id.
drop policy if exists "Users can read their connected accounts" on public.connected_accounts;
drop policy if exists "Users can insert their connected accounts" on public.connected_accounts;
drop policy if exists "Users can update their connected accounts" on public.connected_accounts;
drop policy if exists "Users can delete their connected accounts" on public.connected_accounts;

alter table public.connected_accounts
drop column if exists user_id;

alter table public.connected_accounts
alter column organisation_id set not null;

-- Replace user-scoped policies with organisation-scoped policies.
drop policy if exists "Members can read organisation connected accounts" on public.connected_accounts;
drop policy if exists "Owners and admins can insert organisation connected accounts" on public.connected_accounts;
drop policy if exists "Owners and admins can update organisation connected accounts" on public.connected_accounts;
drop policy if exists "Owners and admins can delete organisation connected accounts" on public.connected_accounts;

create policy "Members can read organisation connected accounts"
  on public.connected_accounts
  for select
  to authenticated
  using (public.is_member_of_organisation(organisation_id));

create policy "Owners and admins can insert organisation connected accounts"
  on public.connected_accounts
  for insert
  to authenticated
  with check (public.is_org_admin_or_owner(organisation_id));

create policy "Owners and admins can update organisation connected accounts"
  on public.connected_accounts
  for update
  to authenticated
  using (public.is_org_admin_or_owner(organisation_id))
  with check (public.is_org_admin_or_owner(organisation_id));

create policy "Owners and admins can delete organisation connected accounts"
  on public.connected_accounts
  for delete
  to authenticated
  using (public.is_org_admin_or_owner(organisation_id));
