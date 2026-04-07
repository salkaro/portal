-- Portal events log — tracks both internal (team) and external (client) activity.
-- Free plan: no events stored. Pro plan: capped at 100 events per organisation.

create type public.portal_event_actor_type as enum ('internal', 'external');

create table public.portal_events (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references public.organisations(id) on delete cascade,
  portal_id        uuid references public.portals(id) on delete set null,
  event_type       text not null,
  actor_type       public.portal_event_actor_type not null,
  -- internal: user display name/email; external: client email or null for anonymous
  actor_label      text,
  -- internal: auth.uid() of the team member who triggered the event
  actor_user_id    uuid references auth.users(id) on delete set null,
  metadata         jsonb,
  created_at       timestamptz not null default now()
);

-- Index for fetching an org's recent events efficiently
create index portal_events_org_created_idx
  on public.portal_events (organisation_id, created_at desc);

-- Index for portal-scoped queries
create index portal_events_portal_idx
  on public.portal_events (portal_id, created_at desc);

-- ----------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------

alter table public.portal_events enable row level security;

-- Org members (any role) can read their org's events
create policy "Org members can read portal events"
  on public.portal_events
  for select
  using (
    exists (
      select 1
      from public.organisation_members om
      where om.organisation_id = portal_events.organisation_id
        and om.user_id = auth.uid()
        and om.approved = true
    )
  );

-- No direct client inserts — all writes go through service role via the function below
create policy "No direct inserts"
  on public.portal_events
  for insert
  with check (false);

-- ----------------------------------------------------------------
-- Insert helper — called from API routes via service role.
-- Enforces plan check: free orgs get no events stored.
-- Enforces cap: pro orgs are capped at 100 events (oldest pruned on overflow).
-- ----------------------------------------------------------------

create or replace function public.insert_portal_event(
  p_organisation_id  uuid,
  p_portal_id        uuid,
  p_event_type       text,
  p_actor_type       public.portal_event_actor_type,
  p_actor_label      text default null,
  p_actor_user_id    uuid default null,
  p_metadata         jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subscription text;
  v_event_count  integer;
  v_limit        integer := 100;
begin
  -- Check org plan — free orgs do not get activity tracking
  select subscription into v_subscription
  from public.organisations
  where id = p_organisation_id;

  if v_subscription is null or v_subscription <> 'pro' then
    return;
  end if;

  -- Count existing events for this org
  select count(*) into v_event_count
  from public.portal_events
  where organisation_id = p_organisation_id;

  -- If at or over cap, delete the oldest event(s) to make room
  if v_event_count >= v_limit then
    delete from public.portal_events
    where id in (
      select id
      from public.portal_events
      where organisation_id = p_organisation_id
      order by created_at asc
      limit (v_event_count - v_limit + 1)
    );
  end if;

  insert into public.portal_events (
    organisation_id,
    portal_id,
    event_type,
    actor_type,
    actor_label,
    actor_user_id,
    metadata
  ) values (
    p_organisation_id,
    p_portal_id,
    p_event_type,
    p_actor_type,
    p_actor_label,
    p_actor_user_id,
    p_metadata
  );
end;
$$;

-- Only callable by service role (API routes) — not exposed to anon/authenticated
revoke all on function public.insert_portal_event(uuid, uuid, text, public.portal_event_actor_type, text, uuid, jsonb) from public;
revoke all on function public.insert_portal_event(uuid, uuid, text, public.portal_event_actor_type, text, uuid, jsonb) from authenticated;
