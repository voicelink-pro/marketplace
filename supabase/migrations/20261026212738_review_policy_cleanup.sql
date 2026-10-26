-- One SELECT policy per role/table. Preserve all ownership, accepted-history
-- and public-release predicates while removing redundant policy evaluation.
drop policy "app_releases: public reads current published" on public.app_releases;
drop policy "app_releases: org member or admin reads all own" on public.app_releases;
create policy "app_releases: anon approved" on public.app_releases for select to anon
  using (is_current_published);
create policy "app_releases: authenticated access" on public.app_releases for select to authenticated
  using (is_current_published or private.is_org_member(organization_id) or (select private.is_platform_admin()));

drop policy "app_terms_versions: public reads current published" on public.app_terms_versions;
drop policy "app_terms_versions: org member or admin reads own" on public.app_terms_versions;
drop policy "app_terms_versions: creator reads accepted history" on public.app_terms_versions;
create policy "app_terms_versions: anon approved" on public.app_terms_versions for select to anon
  using (exists (select 1 from public.app_releases r where r.terms_version_id=app_terms_versions.id and r.is_current_published));
create policy "app_terms_versions: authenticated access" on public.app_terms_versions for select to authenticated
  using (
    private.is_app_org_member(app_id) or (select private.is_platform_admin())
    or exists (select 1 from public.app_releases r where r.terms_version_id=app_terms_versions.id and r.is_current_published)
    or exists (select 1 from public.creator_program_memberships m
      where m.accepted_terms_version_id=app_terms_versions.id and m.creator_id=(select auth.uid()))
  );

drop policy "app_terms_plan_rates: public reads current published" on public.app_terms_plan_rates;
drop policy "app_terms_plan_rates: org member or admin reads own" on public.app_terms_plan_rates;
drop policy "app_terms_plan_rates: creator reads accepted history" on public.app_terms_plan_rates;
create policy "app_terms_plan_rates: anon approved" on public.app_terms_plan_rates for select to anon
  using (exists (select 1 from public.app_releases r where r.terms_version_id=app_terms_plan_rates.terms_version_id and r.is_current_published));
create policy "app_terms_plan_rates: authenticated access" on public.app_terms_plan_rates for select to authenticated
  using (
    (select private.is_platform_admin())
    or exists (select 1 from public.app_terms_versions t where t.id=app_terms_plan_rates.terms_version_id and private.is_app_org_member(t.app_id))
    or exists (select 1 from public.app_releases r where r.terms_version_id=app_terms_plan_rates.terms_version_id and r.is_current_published)
    or exists (select 1 from public.creator_program_memberships m
      where m.accepted_terms_version_id=app_terms_plan_rates.terms_version_id and m.creator_id=(select auth.uid()))
  );

drop policy "profiles: read own or as admin" on public.profiles;
drop policy "profiles: org member reads joined program creators" on public.profiles;
create policy "profiles: authenticated access" on public.profiles for select to authenticated
  using (id=(select auth.uid()) or (select private.is_platform_admin()) or private.can_org_member_read_creator(id));

drop policy "creator_social_links: read own" on public.creator_social_links;
drop policy "creator_social_links: read as admin or joined program org member" on public.creator_social_links;
create policy "creator_social_links: authenticated access" on public.creator_social_links for select to authenticated
  using (creator_id=(select auth.uid()) or (select private.is_platform_admin()) or private.can_org_member_read_creator(creator_id));
