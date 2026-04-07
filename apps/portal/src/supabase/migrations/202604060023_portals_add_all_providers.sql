-- Widen the portals provider check constraint to support all integration providers.

alter table public.portals
  drop constraint if exists portals_provider_check;

alter table public.portals
  add constraint portals_provider_check
  check (provider in ('monday', 'linear', 'clickup', 'asana', 'jira'));
