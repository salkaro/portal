create table if not exists public.portals (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  connection_id uuid not null references public.connected_accounts(id) on delete restrict,
  provider text not null check (provider in ('monday')),
  name text not null,
  slug text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  import_config jsonb not null default '{}'::jsonb,
  customization jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, slug)
);

alter table public.portals enable row level security;

create index if not exists portals_organisation_id_idx
  on public.portals (organisation_id);

create index if not exists portals_connection_id_idx
  on public.portals (connection_id);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'portals'
      and policyname = 'Members can read organisation portals'
  ) then
    create policy "Members can read organisation portals"
      on public.portals
      for select
      to authenticated
      using (public.is_member_of_organisation(organisation_id));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'portals'
      and policyname = 'Owners and admins can insert organisation portals'
  ) then
    create policy "Owners and admins can insert organisation portals"
      on public.portals
      for insert
      to authenticated
      with check (public.is_org_admin_or_owner(organisation_id));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'portals'
      and policyname = 'Owners and admins can update organisation portals'
  ) then
    create policy "Owners and admins can update organisation portals"
      on public.portals
      for update
      to authenticated
      using (public.is_org_admin_or_owner(organisation_id))
      with check (public.is_org_admin_or_owner(organisation_id));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'portals'
      and policyname = 'Owners and admins can delete organisation portals'
  ) then
    create policy "Owners and admins can delete organisation portals"
      on public.portals
      for delete
      to authenticated
      using (public.is_org_admin_or_owner(organisation_id));
  end if;
end
$$;

drop trigger if exists portals_set_updated_at on public.portals;
create trigger portals_set_updated_at
before update on public.portals
for each row
execute function public.set_updated_at();
