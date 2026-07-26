
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  device_token text unique not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  timezone text not null default 'UTC',
  latitude double precision,
  longitude double precision,
  offset_minutes integer not null default 15,
  message_template text not null default 'Fajr is in {minutes} minutes. Wake gently for the prayer of the dawn.',
  title text not null default 'Haya Al-Salat',
  calc_method integer not null default 2,
  next_fajr_utc timestamptz,
  last_sent_at timestamptz,
  failure_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant all on public.push_subscriptions to service_role;

alter table public.push_subscriptions enable row level security;

create index push_subscriptions_next_fajr_idx on public.push_subscriptions (next_fajr_utc);

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create trigger push_subscriptions_updated_at
before update on public.push_subscriptions
for each row execute function public.set_updated_at();
