alter table public.waitlist
  add column if not exists referral_source text;
