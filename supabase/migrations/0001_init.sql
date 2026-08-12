-- ─────────────────────────────────────────────────────────────────────────
-- Pepper (aotc-pm) — initial schema
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query)
-- on a fresh project. Safe to re-run: every statement is guarded with
-- IF NOT EXISTS / CREATE OR REPLACE.
--
-- Mirrors src/data/pm_seed.js 1:1 for the "core" tables so existing views
-- render identically once wired to live data (see Phase 3 of the plan).
-- The "new" tables at the bottom support additive ClickUp-inspired features
-- (team members already ride on auth.users/profiles; comments/tags/
-- checklists/spaces are net-new, nothing existing depends on them).
-- ─────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

-- ─── PEOPLE ────────────────────────────────────────────────────────────────
-- One row per real (write-access) team member. CEO/clients are NOT here —
-- they stay on the existing PIN-picker flow and are not modeled in the DB.
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  email      text not null unique,
  role       text not null check (role in ('pm','cto','cdo','delivery')),
  active     boolean not null default true,   -- soft-deactivate instead of hard delete
  scope_projects text[],                       -- project names this person can see; null = unrestricted (PM)
  points     int not null default 0,           -- gamification — mirrors src/lib/gamification.js while it's localStorage-only
  streak     int not null default 0,
  last_active_date date,
  created_at timestamptz not null default now()
);

create table if not exists gamification_events (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  action     text not null,   -- task_complete | bug_resolve | blocker_resolve
  points     int not null,
  created_at timestamptz not null default now()
);

-- ─── PROJECTS ──────────────────────────────────────────────────────────────
create table if not exists projects (
  id   text primary key,     -- slug, e.g. 'muwci', 'venuesage', 'vibe'
  name text not null
);

-- ─── TASKS (unifies pm_seed.js FEATURES + BUGS) ────────────────────────────
do $$ begin
  create type task_type as enum ('feature','bug','chore');
exception when duplicate_object then null; end $$;

do $$ begin
  create type health_level as enum ('green','yellow','red');
exception when duplicate_object then null; end $$;

create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  clickup_id  text,                                   -- legacy traceability only, unused for sync
  project_id  text references projects(id) on delete set null,
  list_id     uuid,                                    -- fk added below once `lists` exists
  type        task_type not null default 'feature',
  name        text not null,
  status      text not null default 'not_started',     -- not_started/in_progress/delayed/completed/blocked
  owner_id    uuid references profiles(id) on delete set null,
  owner_label text,                                     -- free-text display (e.g. "Caryn / Indranil") for multi-owner/unmigrated cases
  target_date date,
  priority    text,                                     -- P0-P3
  health      health_level not null default 'yellow',
  risk_note   text,
  blocked     boolean not null default false,
  opened_days int,                                      -- bug age in days, manually tracked (mirrors old BUGS.openedDays)
  category   text default 'general',                    -- design/dev/marketing/consulting/general — lets a discipline be viewed across every project
  sort_order  int,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── SPRINT / RELEASES / RISK TRACKING ─────────────────────────────────────
create table if not exists sprints (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  start_date date,
  end_date   date,
  velocity   int
);

create table if not exists sprint_items (
  id         uuid primary key default gen_random_uuid(),
  sprint_id  uuid references sprints(id) on delete cascade,
  task_id    uuid references tasks(id) on delete cascade,
  status     text not null default 'todo',   -- todo/in_progress/blocked/done — independent of the linked task's own status
  blocked    boolean not null default false,
  points     int,
  sort_order int
);

create table if not exists releases (
  id               text primary key,
  project          text,             -- display project name, for per-person space scoping — null = company-wide, PM only
  version          text,
  go_live          date,
  readiness        int,
  qa_status        text,
  critical_bugs    int,
  uat_status       text,
  rollback         boolean default false,
  status           text,
  features         text[],
  deploy_checklist jsonb
);

create table if not exists risks (
  id           text primary key,
  project      text,             -- null = company-wide, PM only
  title        text not null,
  probability  text,
  impact       text,
  owner_label  text,
  mitigation   text,
  mitigated    boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists decisions (
  id                 text primary key,
  project            text,             -- null = company-wide, PM only
  title              text not null,
  owner_label        text,
  impact             text,
  pending_since_days int,
  escalation         boolean default false,
  due_date           date,
  closed             boolean not null default false
);

create table if not exists blockers (
  id           text primary key,
  project      text,             -- null = company-wide, PM only
  title        text not null,
  owner_label  text,
  impact       text,
  due_date     date,
  days_open    int,
  status       text default 'open',
  escalated    boolean default false
);

create table if not exists team_capacity (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  team_label text not null,
  capacity   int default 100,
  load       int default 0,
  members    int default 1,
  blocked    int default 0
);

create table if not exists health_matrix (
  area   text primary key,
  status text not null
);

create table if not exists bug_trend (
  week     text primary key,
  opened   int default 0,
  resolved int default 0
);

-- ─── BUSINESS / CUSTOMER (⚠️ largely manual, just persisted now) ──────────
create table if not exists customer_metrics (
  id                 int primary key default 1,
  open_tickets       int,
  critical_issues    int,
  sla_breaches       int,
  feature_requests   int,
  high_risk_accounts int,
  csat               numeric,
  constraint customer_metrics_singleton check (id = 1)
);

create table if not exists customer_accounts (
  name   text primary key,
  tickets int,
  sla    text,
  risk   text,
  mrr    numeric
);

create table if not exists product_usage (
  feature  text primary key,
  released text,
  adoption int,
  target   int,
  trend    text,
  dau      int
);

create table if not exists business_metrics (
  id            int primary key default 1,
  arr           numeric,
  mrr           numeric,
  mrr_growth    numeric,
  churn         numeric,
  new_customers int,
  trial_to_paid numeric,
  renewal_risk  int,
  nps           numeric,
  constraint business_metrics_singleton check (id = 1)
);

create table if not exists budget (
  team    text primary key,
  planned numeric,
  actual  numeric
);

-- ─── NEW: ClickUp-inspired additive features ───────────────────────────────

create table if not exists task_comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references tasks(id) on delete cascade,
  author_id  uuid references profiles(id) on delete set null,
  body       text not null,
  created_at timestamptz not null default now()
);

create table if not exists tags (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique,
  color text default '#5D9E8E'
);

create table if not exists task_tags (
  task_id uuid not null references tasks(id) on delete cascade,
  tag_id  uuid not null references tags(id) on delete cascade,
  primary key (task_id, tag_id)
);

create table if not exists task_checklist_items (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references tasks(id) on delete cascade,
  label      text not null,
  done       boolean not null default false,
  sort_order int default 0
);

create table if not exists spaces (
  id   uuid primary key default gen_random_uuid(),
  name text not null
);

create table if not exists folders (
  id       uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces(id) on delete cascade,
  name     text not null
);

create table if not exists lists (
  id        uuid primary key default gen_random_uuid(),
  space_id  uuid references spaces(id) on delete cascade,
  folder_id uuid references folders(id) on delete cascade,
  name      text not null,
  constraint lists_parent_check check (space_id is not null or folder_id is not null)
);

-- tasks.list_id fk (deferred until `lists` exists)
do $$ begin
  alter table tasks add constraint tasks_list_id_fkey foreign key (list_id) references lists(id) on delete set null;
exception when duplicate_object then null; end $$;

-- ─── EXECUTIVE MODULES: invoices, pipeline, meetings, notes ────────────────
-- Manual-entry for now (no accounting/CRM tool connected), but field names
-- follow real-tool conventions (QuickBooks/Zoho Books; HubSpot deals) so a
-- later integration is a drop-in. See src/lib/execData.js for the active
-- (currently local-storage) implementation.

create table if not exists invoices (
  id          uuid primary key default gen_random_uuid(),
  client      text not null,
  project     text,
  amount      numeric not null default 0,
  currency    text not null default 'INR',
  issue_date  date,
  due_date    date,
  paid_date   date,
  status      text not null default 'sent' check (status in ('draft','sent','paid','overdue','void')),
  notes       text,
  created_at  timestamptz not null default now()
);

create table if not exists opportunities (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  company    text,
  type       text not null default 'new_client' check (type in ('new_client','upsell')),
  stage      text not null default 'lead' check (stage in ('lead','contacted','proposal','negotiation','won','lost')),
  amount     numeric,
  owner      text,
  close_date date,
  notes      text,
  created_at timestamptz not null default now()
);

create table if not exists meetings (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  date          date not null,
  attendees     text[],
  project       text,
  notes         text,              -- empty = upcoming reminder, filled = a logged past meeting
  action_items  jsonb default '[]',
  created_at    timestamptz not null default now()
);

create table if not exists notes (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  project    text,
  category   text not null default 'general' check (category in ('product','plan','general')),
  body       text,
  author     text,
  created_at timestamptz not null default now()
);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────
-- Read: anyone with the anon key (matches today's actual security level —
-- the existing PIN check is client-side only). Write: only signed-in profiles.

create or replace function is_team_member() returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and active);
$$ language sql stable security definer;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'profiles','projects','tasks','sprints','sprint_items','releases','risks',
    'decisions','blockers','team_capacity','health_matrix','bug_trend',
    'customer_metrics','customer_accounts','product_usage','business_metrics','budget',
    'task_comments','tags','task_tags','task_checklist_items','spaces','folders','lists',
    'gamification_events','invoices','opportunities','meetings','notes'
  ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I_select on %I', t, t);
    execute format('create policy %I_select on %I for select using (true)', t, t);
    execute format('drop policy if exists %I_write on %I', t, t);
    execute format('create policy %I_write on %I for all using (is_team_member()) with check (is_team_member())', t, t);
  end loop;
end $$;

-- profiles: everyone can read (needed for owner dropdowns/nav); a person may
-- update only their own row; creation happens via the Team Members admin
-- flow (service-role key / edge function), not via this policy.
drop policy if exists profiles_self_update on profiles;
create policy profiles_self_update on profiles for update using (id = auth.uid());
