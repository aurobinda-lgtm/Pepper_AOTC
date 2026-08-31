-- ─────────────────────────────────────────────────────────────────────────
-- Pepper (aotc-pm) — Phase 1: multi-tenant foundation
--
-- Adds organizations + organization_members, backfills every existing row
-- into AOTC's own org, and replaces the blanket is_team_member()-only RLS
-- policies with org-scoped ones. Safe to re-run: every statement is guarded.
--
-- NOTE: `profiles` is deliberately excluded from the organization_id backfill
-- below. Under multi-tenancy a person (one auth.users row) can belong to
-- several orgs, so `profiles` stays a global identity table — per-org
-- role/scope now lives on `organization_members`, not on `profiles` itself.
-- Applying organization_id to `profiles` would contradict the very
-- multi-membership model this migration exists to build.
-- ─────────────────────────────────────────────────────────────────────────

-- ─── ORGANIZATIONS ──────────────────────────────────────────────────────────

create table if not exists organizations (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,   -- url-safe, reserved for future subdomain/path routing
  name       text not null,
  created_at timestamptz not null default now()
);

-- Seed AOTC's own org with a fixed id so the backfill below has a target.
insert into organizations (id, slug, name)
values ('00000000-0000-0000-0000-000000000001', 'aotc', 'Art of Tech Consulting')
on conflict (slug) do nothing;

-- ─── ORGANIZATION MEMBERSHIP ────────────────────────────────────────────────

create table if not exists organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  profile_id      uuid not null references profiles(id) on delete cascade,
  role            text not null default 'member',   -- free text (pm/cto/cdo/delivery/client/owner/…) —
                                                       -- not a check-constrained enum, so new roles don't
                                                       -- need a schema migration
  scope_projects  text[],                             -- moved off profiles: scope is per-membership now
  active          boolean not null default true,
  invited_at      timestamptz not null default now(),
  joined_at       timestamptz,
  unique (organization_id, profile_id)
);

-- Bring the 7 existing real profiles into AOTC's org with their current role/scope.
insert into organization_members (organization_id, profile_id, role, scope_projects, active, joined_at)
select '00000000-0000-0000-0000-000000000001', id, role, scope_projects, active, created_at
from profiles
on conflict (organization_id, profile_id) do nothing;

-- ─── SESSION: which org is "current" for a signed-in user ──────────────────

create table if not exists user_settings (
  profile_id              uuid primary key references profiles(id) on delete cascade,
  current_organization_id uuid references organizations(id)
);

create or replace function current_org() returns uuid as $$
  select current_organization_id from user_settings where profile_id = auth.uid();
$$ language sql stable security definer;

create or replace function is_org_member(org uuid) returns boolean as $$
  select exists (
    select 1 from organization_members
    where organization_id = org and profile_id = auth.uid() and active
  );
$$ language sql stable security definer;

-- ─── BACKFILL organization_id ONTO EVERY DOMAIN TABLE (not `profiles`) ──────

do $$
declare t text;
begin
  for t in select unnest(array[
    'projects','tasks','sprints','sprint_items','releases','risks',
    'decisions','blockers','team_capacity','health_matrix','bug_trend',
    'customer_metrics','customer_accounts','product_usage','business_metrics','budget',
    'task_comments','tags','task_tags','task_checklist_items','spaces','folders','lists',
    'gamification_events','invoices','opportunities','meetings','notes'
  ])
  loop
    execute format('alter table %I add column if not exists organization_id uuid references organizations(id)', t);
    execute format('update %I set organization_id = ''00000000-0000-0000-0000-000000000001'' where organization_id is null', t);
    execute format('alter table %I alter column organization_id set not null', t);
  end loop;
end $$;

-- customer_metrics / business_metrics were singleton rows (id=1) — under
-- multi-tenancy they become one row per org, so organization_id replaces id
-- as the primary key instead of sitting alongside it.
alter table customer_metrics drop constraint if exists customer_metrics_singleton;
alter table customer_metrics drop constraint if exists customer_metrics_pkey;
alter table customer_metrics add primary key (organization_id);
alter table customer_metrics drop column if exists id;

alter table business_metrics drop constraint if exists business_metrics_singleton;
alter table business_metrics drop constraint if exists business_metrics_pkey;
alter table business_metrics add primary key (organization_id);
alter table business_metrics drop column if exists id;

-- ─── RLS: organizations / organization_members / user_settings ─────────────

alter table organizations enable row level security;
drop policy if exists organizations_select on organizations;
create policy organizations_select on organizations for select
  using (id in (select organization_id from organization_members where profile_id = auth.uid() and active));
-- no insert/update/delete policy: orgs are provisioned via the service-role
-- key (invite-only, per product decision), which bypasses RLS entirely.

alter table organization_members enable row level security;
drop policy if exists organization_members_select on organization_members;
create policy organization_members_select on organization_members for select
  using (organization_id in (select organization_id from organization_members where profile_id = auth.uid() and active));
drop policy if exists organization_members_write on organization_members;
create policy organization_members_write on organization_members for all
  using (exists (
    select 1 from organization_members m
    where m.organization_id = organization_members.organization_id
      and m.profile_id = auth.uid() and m.role in ('owner', 'pm') and m.active
  ))
  with check (exists (
    select 1 from organization_members m
    where m.organization_id = organization_members.organization_id
      and m.profile_id = auth.uid() and m.role in ('owner', 'pm') and m.active
  ));

alter table user_settings enable row level security;
drop policy if exists user_settings_all on user_settings;
create policy user_settings_all on user_settings for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ─── RLS: replace the blanket is_team_member()-only policies with org scoping ─
-- (profiles keeps its existing 0001 policies untouched — it's a global
-- identity table, not org-scoped; see note at the top of this file.)

do $$
declare t text;
begin
  for t in select unnest(array[
    'projects','tasks','sprints','sprint_items','releases','risks',
    'decisions','blockers','team_capacity','health_matrix','bug_trend',
    'customer_metrics','customer_accounts','product_usage','business_metrics','budget',
    'task_comments','tags','task_tags','task_checklist_items','spaces','folders','lists',
    'gamification_events','invoices','opportunities','meetings','notes'
  ])
  loop
    execute format('drop policy if exists %I_select on %I', t, t);
    execute format('create policy %I_select on %I for select using (organization_id = current_org())', t, t);
    execute format('drop policy if exists %I_write on %I', t, t);
    execute format(
      'create policy %I_write on %I for all using (organization_id = current_org() and is_org_member(organization_id)) with check (organization_id = current_org() and is_org_member(organization_id))',
      t, t
    );
  end loop;
end $$;
