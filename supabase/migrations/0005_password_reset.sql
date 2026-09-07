-- ─────────────────────────────────────────────────────────────────────────
-- Pepper (aotc-pm) — PM-issued temporary passwords + forced first-login reset
--
-- New members are no longer created via Supabase's email-invite link;
-- the PM sets a temporary password directly when creating the profile
-- (see supabase/functions/invite-org-member), and the new member is
-- required to set their own password the first time they sign in with it.
-- must_reset_password tracks whether that first-login reset is still owed.
-- Defaults to false so existing accounts aren't retroactively forced
-- through it — only profiles created by the updated invite flow start true.
-- ─────────────────────────────────────────────────────────────────────────

alter table profiles add column if not exists must_reset_password boolean not null default false;

-- Creating/editing organization_members (i.e. inviting or changing someone's
-- membership) is now PM-only, not "any owner/pm" — tightened to match.
drop policy if exists organization_members_write on organization_members;
create policy organization_members_write on organization_members for all
  using (exists (
    select 1 from organization_members m
    where m.organization_id = organization_members.organization_id
      and m.profile_id = auth.uid() and m.role = 'pm' and m.active
  ))
  with check (exists (
    select 1 from organization_members m
    where m.organization_id = organization_members.organization_id
      and m.profile_id = auth.uid() and m.role = 'pm' and m.active
  ));
