create table if not exists public.connected_accounts (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  provider text not null check (provider in ('monday', 'clickup', 'asana', 'linear')),
  external_account_id text,
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, provider)
);

alter table public.connected_accounts enable row level security;

create index if not exists connected_accounts_organisation_id_idx
  on public.connected_accounts (organisation_id);

create index if not exists connected_accounts_provider_idx
  on public.connected_accounts (provider);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'connected_accounts'
      and policyname = 'Members can read organisation connected accounts'
  ) then
    create policy "Members can read organisation connected accounts"
      on public.connected_accounts
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
      and tablename = 'connected_accounts'
      and policyname = 'Owners and admins can insert organisation connected accounts'
  ) then
    create policy "Owners and admins can insert organisation connected accounts"
      on public.connected_accounts
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
      and tablename = 'connected_accounts'
      and policyname = 'Owners and admins can update organisation connected accounts'
  ) then
    create policy "Owners and admins can update organisation connected accounts"
      on public.connected_accounts
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
      and tablename = 'connected_accounts'
      and policyname = 'Owners and admins can delete organisation connected accounts'
  ) then
    create policy "Owners and admins can delete organisation connected accounts"
      on public.connected_accounts
      for delete
      to authenticated
      using (public.is_org_admin_or_owner(organisation_id));
  end if;
end
$$;

drop trigger if exists connected_accounts_set_updated_at on public.connected_accounts;
create trigger connected_accounts_set_updated_at
before update on public.connected_accounts
for each row
execute function public.set_updated_at();
