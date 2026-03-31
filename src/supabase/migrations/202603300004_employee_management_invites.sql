create table if not exists public.organisation_invites (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  code text not null unique,
  role text not null default 'member' check (role in ('admin', 'member')),
  uses_left integer not null default 1,
  email text,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists organisation_invites_code_key
on public.organisation_invites (code);

alter table public.organisation_invites enable row level security;

-- Replace narrow self-only policy with org-wide visibility for members.
drop policy if exists "Users can read their own memberships" on public.organisation_members;

create policy "Members can read organisation memberships"
  on public.organisation_members
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organisation_members my
      where my.organisation_id = organisation_members.organisation_id
        and my.user_id = auth.uid()
    )
  );

create policy "Owners and admins can update memberships"
  on public.organisation_members
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.organisation_members my
      where my.organisation_id = organisation_members.organisation_id
        and my.user_id = auth.uid()
        and my.role in ('owner', 'admin')
    )
    and organisation_members.role <> 'owner'
  )
  with check (
    exists (
      select 1
      from public.organisation_members my
      where my.organisation_id = organisation_members.organisation_id
        and my.user_id = auth.uid()
        and my.role in ('owner', 'admin')
    )
    and organisation_members.role <> 'owner'
  );

drop policy if exists "Users can delete their own memberships" on public.organisation_members;

create policy "Owners and admins can delete memberships"
  on public.organisation_members
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.organisation_members my
      where my.organisation_id = organisation_members.organisation_id
        and my.user_id = auth.uid()
        and my.role in ('owner', 'admin')
    )
    and organisation_members.role <> 'owner'
  );

create policy "Members can read invites in their organisations"
  on public.organisation_invites
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organisation_members om
      where om.organisation_id = organisation_invites.organisation_id
        and om.user_id = auth.uid()
    )
  );

create policy "Owners and admins can create invites"
  on public.organisation_invites
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.organisation_members om
      where om.organisation_id = organisation_invites.organisation_id
        and om.user_id = auth.uid()
        and om.role in ('owner', 'admin')
    )
  );

create policy "Owners and admins can update invites"
  on public.organisation_invites
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.organisation_members om
      where om.organisation_id = organisation_invites.organisation_id
        and om.user_id = auth.uid()
        and om.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.organisation_members om
      where om.organisation_id = organisation_invites.organisation_id
        and om.user_id = auth.uid()
        and om.role in ('owner', 'admin')
    )
  );

create policy "Owners and admins can delete invites"
  on public.organisation_invites
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.organisation_members om
      where om.organisation_id = organisation_invites.organisation_id
        and om.user_id = auth.uid()
        and om.role in ('owner', 'admin')
    )
  );
