-- Allow organisations to store multiple connections per integration provider.

alter table public.connected_accounts
drop constraint if exists connected_accounts_organisation_id_provider_key;

-- Prevent duplicate records for the exact same external account when that ID is available.
create unique index if not exists connected_accounts_org_provider_external_account_key
  on public.connected_accounts (organisation_id, provider, external_account_id)
  where external_account_id is not null;

-- Keep query performance for organisation/provider listing.
create index if not exists connected_accounts_org_provider_idx
  on public.connected_accounts (organisation_id, provider, created_at desc);
