-- ============================================================================
-- World Business Plus — Email marketing & newsletter
-- Extends newsletter_subscribers and adds campaigns + per-recipient sends.
-- Idempotent: safe to run multiple times. Apply via Supabase SQL editor
-- (or psql "$DATABASE_URL" -f supabase/newsletter.sql).
-- ============================================================================

-- ---- 1) Subscribers: lifecycle status + double opt-in / unsubscribe token ----
alter table newsletter_subscribers add column if not exists status          text not null default 'subscribed';
alter table newsletter_subscribers add column if not exists token           text;
alter table newsletter_subscribers add column if not exists lang            text not null default 'fr';
alter table newsletter_subscribers add column if not exists source          text not null default 'website';
alter table newsletter_subscribers add column if not exists confirmed_at    timestamptz;
alter table newsletter_subscribers add column if not exists unsubscribed_at timestamptz;

-- status ∈ subscribed | pending | unsubscribed | bounced
alter table newsletter_subscribers drop constraint if exists newsletter_subscribers_status_chk;
alter table newsletter_subscribers add  constraint newsletter_subscribers_status_chk
  check (status in ('subscribed','pending','unsubscribed','bounced'));

-- Back-fill a token for any existing rows so unsubscribe links keep working.
update newsletter_subscribers set token = replace(gen_random_uuid()::text,'-','') where token is null;
create unique index if not exists newsletter_subscribers_token_key on newsletter_subscribers (token);
create index        if not exists newsletter_subscribers_status_idx on newsletter_subscribers (status);

-- ---- 2) Campaigns ----------------------------------------------------------
create table if not exists email_campaigns (
  id          uuid primary key default gen_random_uuid(),
  subject     text not null,
  preheader   text,
  body_html   text not null default '',
  audience    text not null default 'all',          -- v1: 'all' (subscribed only)
  status      text not null default 'draft',         -- draft | sending | sent
  sent_count  integer not null default 0,
  open_count  integer not null default 0,
  click_count integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  sent_at     timestamptz
);
alter table email_campaigns drop constraint if exists email_campaigns_status_chk;
alter table email_campaigns add  constraint email_campaigns_status_chk
  check (status in ('draft','sending','sent'));

-- ---- 3) Per-recipient sends (dedupe + open/click attribution) --------------
create table if not exists email_campaign_sends (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references email_campaigns(id) on delete cascade,
  subscriber_id uuid references newsletter_subscribers(id) on delete set null,
  email         text not null,
  status        text not null default 'sent',        -- sent | failed | bounced
  error         text,
  opened_at     timestamptz,
  clicked_at    timestamptz,
  sent_at       timestamptz not null default now()
);
create unique index if not exists email_campaign_sends_unq on email_campaign_sends (campaign_id, email);
create index        if not exists email_campaign_sends_campaign_idx on email_campaign_sends (campaign_id);

-- ---- 4) RLS: enabled, no public policies (all access via service role) -----
alter table email_campaigns      enable row level security;
alter table email_campaign_sends enable row level security;
