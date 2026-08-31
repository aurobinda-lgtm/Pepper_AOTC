-- ─────────────────────────────────────────────────────────────────────────
-- Pepper (aotc-pm) — Stage 1/2 of the Dashboard.jsx real-data rewire
--
-- Adds the columns the Projects view needs that weren't in 0001 (projects
-- only had id/name — everything else came from src/data/seed.js), plus a
-- workload column on profiles to replace the fake TEAM_SEED.load, plus a
-- notes column on tasks for MY_TASKS' real notes (separate from clickup_id).
-- Safe to re-run: every statement is guarded with IF NOT EXISTS.
-- ─────────────────────────────────────────────────────────────────────────

alter table projects add column if not exists client    text;
alter table projects add column if not exists company   text not null default 'aot';
alter table projects add column if not exists health    text not null default 'yellow' check (health in ('green','yellow','red'));
alter table projects add column if not exists milestone text;
alter table projects add column if not exists due       date;
alter table projects add column if not exists notes     text;

alter table profiles add column if not exists workload int not null default 0;

alter table tasks add column if not exists notes text;

-- Seed the 10 real projects (id = ClickUp-space slug, matching what
-- src/lib/queries.js's createTask() already upserts via slugify(project)).
-- client/company are filled from pm_seed.js's CUSTOMER_METRICS.accounts;
-- health is a starting rollup from pm_seed.js's FEATURES/BUGS at the time
-- of this migration — override anytime via the Projects view once live.
insert into projects (id, name, client, company, health) values
  ('muwci',       'MUWCI',        'MUWCI (UWC)',      'aot', 'red'),
  ('venuesage',   'VenueSage',    'VenueSage',         'aot', 'red'),
  ('ufobuzz',     'UFO Buzz',     'UFO (Sanjay G.)',   'aot', 'green'),
  ('ufoemotive',  'UFO Emotive',  'UFO (Sanjay G.)',   'aot', 'yellow'),
  ('ufoaurora',   'UFO Aurora',   'UFO (Sanjay G.)',   'aot', 'yellow'),
  ('carer',       'Carer',        'Carer (Samara)',    'aot', 'yellow'),
  ('campusos',    'Campus OS',    null,                'aot', 'yellow'),
  ('aotc-web',    'AOTC Website', 'Internal',           'aot', 'red'),
  ('vibe',        'VIBE',         null,                'aot', 'yellow'),
  ('nain',        'NAIN',         null,                'aot', 'yellow')
on conflict (id) do update set
  client  = excluded.client,
  company = excluded.company,
  health  = excluded.health;
