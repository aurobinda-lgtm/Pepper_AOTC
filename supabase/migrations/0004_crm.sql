-- ─────────────────────────────────────────────────────────────────────────
-- Pepper (aotc-pm) — CRM foundation: accounts, contacts, and the
-- CRM→delivery bridge (projects/opportunities linked to an account).
--
-- Reuses the existing `opportunities` table from 0001_init.sql (until now
-- only wired to the local-storage-only src/lib/execData.js) rather than
-- creating a new one. `organization_id` already exists on `opportunities`
-- and `projects` from the 0003 migration loop — only new FK columns are
-- added here.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists accounts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name            text not null,
  domain          text,
  notes           text,
  created_at      timestamptz not null default now()
);

create table if not exists contacts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  account_id      uuid references accounts(id) on delete set null,
  name            text not null,
  email           text,
  phone           text,
  title           text,
  role_label      text,   -- free text, e.g. "Decision Maker" / "Champion" — not an enum, mirrors organization_members.role
  created_at      timestamptz not null default now()
);

alter table opportunities add column if not exists account_id uuid references accounts(id);
alter table opportunities add column if not exists primary_contact_id uuid references contacts(id);

-- The CRM→delivery bridge: a project knows which account and (if any)
-- which opportunity it came from, instead of re-entering client context.
alter table projects add column if not exists account_id uuid references accounts(id);
alter table projects add column if not exists opportunity_id uuid references opportunities(id);

-- ─── RLS: same org-scoped pattern as every table added in 0003 ─────────────

alter table accounts enable row level security;
drop policy if exists accounts_select on accounts;
create policy accounts_select on accounts for select using (organization_id = current_org());
drop policy if exists accounts_write on accounts;
create policy accounts_write on accounts for all
  using (organization_id = current_org() and is_org_member(organization_id))
  with check (organization_id = current_org() and is_org_member(organization_id));

alter table contacts enable row level security;
drop policy if exists contacts_select on contacts;
create policy contacts_select on contacts for select using (organization_id = current_org());
drop policy if exists contacts_write on contacts;
create policy contacts_write on contacts for all
  using (organization_id = current_org() and is_org_member(organization_id))
  with check (organization_id = current_org() and is_org_member(organization_id));

-- ─── SEED: real accounts for AOTC's org, from pm_seed.js's CUSTOMER_METRICS ─
-- GDL (Gilani's) and MovieBeam (Ankur) are seeded as accounts with no
-- active project — they're real client relationships, just dormant per the
-- pm_seed.js sync notes, not fabricated. UFO's three real projects
-- (ufobuzz/ufoemotive/ufoaurora) all roll up to the one UFO account.

insert into accounts (organization_id, name)
select '00000000-0000-0000-0000-000000000001', v.name
from (values
  ('MUWCI (UWC)'), ('Carer (Samara)'), ('GDL (Gilani''s)'),
  ('UFO (Sanjay G.)'), ('MovieBeam (Ankur)')
) as v(name)
where not exists (
  select 1 from accounts a where a.organization_id = '00000000-0000-0000-0000-000000000001' and a.name = v.name
);

update projects set account_id = (select id from accounts where name = 'MUWCI (UWC)' and organization_id = '00000000-0000-0000-0000-000000000001')
  where id = 'muwci' and account_id is null;
update projects set account_id = (select id from accounts where name = 'Carer (Samara)' and organization_id = '00000000-0000-0000-0000-000000000001')
  where id = 'carer' and account_id is null;
update projects set account_id = (select id from accounts where name = 'UFO (Sanjay G.)' and organization_id = '00000000-0000-0000-0000-000000000001')
  where id in ('ufobuzz', 'ufoemotive', 'ufoaurora') and account_id is null;
