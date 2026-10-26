-- Preserve immutable business contents while allowing reference-only cleanup
-- driven by existing ON DELETE actions. No account-deletion UI is introduced.
create or replace function private.forbid_version_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    -- Only FK cleanup may unlink an actor whose profile has been removed.
    if tg_table_name = 'app_terms_versions' then
      if new.created_by is null and old.created_by is not null
        and (to_jsonb(new)-'created_by') = (to_jsonb(old)-'created_by')
        and not exists (select 1 from public.profiles where id=old.created_by)
      then return new; end if;
    elsif tg_table_name = 'app_terms_plan_rates' then
      -- A standalone published plan is archived, never deleted. Allow the FK
      -- update only while the entire parent app is already being removed.
      if new.plan_id is null and old.plan_id is not null
        and (to_jsonb(new)-'plan_id') = (to_jsonb(old)-'plan_id')
        and not exists (
          select 1 from public.app_terms_versions t join public.apps a on a.id=t.app_id
          where t.id=old.terms_version_id
        )
      then return new; end if;
    end if;
    raise exception 'version_records_are_immutable' using errcode = 'P0001';
  end if;

  -- Allow cascade deletion only when the parent app is being deleted.
  if tg_table_name = 'app_terms_versions' then
    if exists (select 1 from public.apps where id = old.app_id) then
      raise exception 'version_records_are_immutable' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'app_terms_plan_rates' then
    if exists (select 1 from public.app_terms_versions where id = old.terms_version_id) then
      raise exception 'version_records_are_immutable' using errcode = 'P0001';
    end if;
  end if;

  return old;
end;
$$;

create or replace function private.forbid_review_event_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.actor_id is null and old.actor_id is not null
      and (to_jsonb(new)-'actor_id') = (to_jsonb(old)-'actor_id')
      and not exists (select 1 from public.profiles where id=old.actor_id)
    then return new; end if;
    raise exception 'review_events_are_immutable' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.apps where id = old.app_id) then
    raise exception 'review_events_are_immutable' using errcode = 'P0001';
  end if;
  return old;
end;
$$;

-- Cascades on one app remove both sides of these relations. Check them at
-- transaction end so the ordering of sibling cascade triggers is irrelevant.
alter table public.app_releases drop constraint app_releases_terms_version_id_fkey;
alter table public.app_releases add constraint app_releases_terms_version_id_fkey
  foreign key (terms_version_id) references public.app_terms_versions(id)
  on delete no action deferrable initially deferred;
alter table public.creator_program_memberships drop constraint creator_program_memberships_accepted_terms_version_id_fkey;
alter table public.creator_program_memberships add constraint creator_program_memberships_accepted_terms_version_id_fkey
  foreign key (accepted_terms_version_id) references public.app_terms_versions(id)
  on delete no action deferrable initially deferred;
