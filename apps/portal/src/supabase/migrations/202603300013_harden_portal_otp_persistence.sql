drop function if exists public.create_portal_email_otp(uuid, text, text, timestamptz);

create or replace function public.create_portal_email_otp(
  p_portal_id uuid,
  p_email text,
  p_otp_hash text,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_allowed_emails text[];
  v_access_type text;
  v_inserted_id uuid;
begin
  v_email := lower(trim(p_email));

  select p.access_type, p.access_email_allowlist
  into v_access_type, v_allowed_emails
  from public.portals p
  where p.id = p_portal_id
    and p.status <> 'archived'
  limit 1;

  if v_access_type is null then
    raise exception 'Portal not found';
  end if;

  if v_access_type <> 'email_otp' then
    raise exception 'Portal does not allow email access';
  end if;

  if not exists (
    select 1
    from unnest(v_allowed_emails) as allowed_email
    where lower(trim(allowed_email)) = v_email
  ) then
    raise exception 'Email is not allowed for this portal';
  end if;

  insert into public.portal_access_otps (portal_id, email, otp_hash, expires_at)
  values (p_portal_id, v_email, p_otp_hash, p_expires_at)
  returning id into v_inserted_id;

  return v_inserted_id;
end;
$$;

revoke all on function public.create_portal_email_otp(uuid, text, text, timestamptz) from public;
grant execute on function public.create_portal_email_otp(uuid, text, text, timestamptz) to anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'portal_access_otps'
      and policyname = 'Owners and admins can read portal OTP logs'
  ) then
    create policy "Owners and admins can read portal OTP logs"
      on public.portal_access_otps
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.portals p
          where p.id = portal_access_otps.portal_id
            and public.is_org_admin_or_owner(p.organisation_id)
        )
      );
  end if;
end
$$;
