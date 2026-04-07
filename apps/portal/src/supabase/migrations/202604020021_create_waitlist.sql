-- Waitlist table for early access sign-ups.
-- access_granted is set automatically by the API (first 150 entries).
-- The service role client handles all reads/writes — no RLS required.

create table public.waitlist (
  id             uuid        primary key default gen_random_uuid(),
  email          text        not null unique,
  agency_size    text,
  client_count   text,
  tools_used     text[]      not null default '{}',
  update_method   text,
  referral_source text,
  access_granted  boolean     not null default false,
  created_at     timestamptz not null default now()
);
