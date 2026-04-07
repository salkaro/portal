-- Sync DB retention cap with app-configured activity event limit.
-- This keeps storage pruning aligned with what the app expects.

drop function if exists public.insert_portal_event(
  uuid,
  uuid,
  text,
  public.portal_event_actor_type,
  text,
  uuid,
  jsonb
);

create or replace function public.insert_portal_event(
  p_organisation_id  uuid,
  p_portal_id        uuid,
  p_event_type       text,
  p_actor_type       public.portal_event_actor_type,
  p_actor_label      text default null,
  p_actor_user_id    uuid default null,
  p_metadata         jsonb default null,
  p_limit            integer default 100
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subscription text;
  v_event_count  integer;
  v_limit        integer;
begin
  select subscription into v_subscription
  from public.organisations
  where id = p_organisation_id;

  -- Free plan has no persisted events.
  if v_subscription is null or v_subscription <> 'pro' then
    return;
  end if;

  -- Defensive fallback if caller provides an invalid limit.
  v_limit := greatest(coalesce(p_limit, 100), 1);

  select count(*) into v_event_count
  from public.portal_events
  where organisation_id = p_organisation_id;

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

revoke all on function public.insert_portal_event(
  uuid,
  uuid,
  text,
  public.portal_event_actor_type,
  text,
  uuid,
  jsonb,
  integer
) from public;

revoke all on function public.insert_portal_event(
  uuid,
  uuid,
  text,
  public.portal_event_actor_type,
  text,
  uuid,
  jsonb,
  integer
) from authenticated;
