-- Immutable private objects; only references in the CURRENT approved release
-- become public. No user UPDATE/DELETE policy: a new file always gets a new path.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('app-media','app-media',false,26214400,
  array['image/png','image/jpeg','image/webp','video/mp4','video/webm'])
on conflict (id) do update set public=false, file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

create function private.app_media_app_id(p_name text)
returns uuid language sql immutable set search_path = '' as $$
  select case when p_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp|mp4|webm)$'
    then split_part(p_name,'/',1)::uuid else null end
$$;

create function private.is_published_app_media(p_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.app_releases r where r.is_current_published
      and r.app_id = private.app_media_app_id(p_name)
      and (
        r.logo_url = '/media/apps/' || p_name
        or r.cover_image_url = '/media/apps/' || p_name
        or r.video_url = '/media/apps/' || p_name
        or exists (select 1 from jsonb_array_elements(r.screenshots) s
          where s->>'url' = '/media/apps/' || p_name)
      )
  )
$$;

create function private.can_read_app_media(p_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_published_app_media(p_name)
    or ((select auth.uid()) is not null and (
      private.is_app_org_member(private.app_media_app_id(p_name))
      or (select private.is_platform_admin())
    ))
$$;

create policy "app-media: approved objects or own organization"
  on storage.objects for select to anon,authenticated using (
    bucket_id='app-media' and private.can_read_app_media(name)
  );
create policy "app-media: owner inserts immutable objects"
  on storage.objects for insert to authenticated with check (
    bucket_id='app-media'
    and private.is_app_org_owner(private.app_media_app_id(name))
  );

create or replace function private.is_valid_media_url(p_url text)
returns boolean language sql immutable set search_path = '' as $$
  select p_url is not null and (
    private.is_valid_https_url(p_url)
    or p_url ~ '^/demo/[A-Za-z0-9/_-]+(\.[A-Za-z0-9]+)?$'
    or (left(p_url,12)='/media/apps/'
      and private.app_media_app_id(substr(p_url,13)) is not null)
  )
$$;

create function private.validate_managed_app_media()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_url text; v_app_id uuid;
begin
  if tg_table_name='apps' then v_app_id := new.id; else v_app_id := new.app_id; end if;
  for v_url in
    select unnest(array[new.logo_url,new.cover_image_url,new.video_url])
    union all select value->>'url' from jsonb_array_elements(new.screenshots)
  loop
    if v_url like '/media/apps/%' then
      if private.app_media_app_id(substr(v_url,13)) is distinct from v_app_id
        or not exists(select 1 from storage.objects where bucket_id='app-media' and name=substr(v_url,13))
      then
        raise exception 'invalid_or_foreign_media_object' using errcode='22023';
      end if;
    end if;
  end loop;
  return new;
end;
$$;
create trigger apps_validate_managed_media before insert or update of logo_url,cover_image_url,video_url,screenshots on public.apps
  for each row execute function private.validate_managed_app_media();
create trigger releases_validate_managed_media before insert on public.app_releases
  for each row execute function private.validate_managed_app_media();

revoke all on function private.app_media_app_id(text),private.is_published_app_media(text),
  private.validate_managed_app_media(),private.can_read_app_media(text) from public,anon,authenticated,service_role;
grant execute on function private.app_media_app_id(text),private.is_published_app_media(text),private.can_read_app_media(text)
  to anon,authenticated,service_role;
