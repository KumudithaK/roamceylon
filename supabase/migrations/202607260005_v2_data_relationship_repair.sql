begin;

-- Public RLS policies call this function as part of their boolean expression.
-- The function is safe for anonymous callers because auth.uid() is null and
-- therefore returns false, but anon still requires EXECUTE to evaluate policy.
grant execute on function private.has_role(public.profile_role[]) to anon;

create table if not exists public.vehicle_destinations (
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  destination_id uuid not null references public.destinations(id) on delete cascade,
  primary key(vehicle_id,destination_id)
);
create index if not exists vehicle_destinations_destination_idx on public.vehicle_destinations(destination_id);
alter table public.vehicle_destinations enable row level security;
create policy vehicle_destinations_read on public.vehicle_destinations for select to anon,authenticated
using (
  (
    exists(select 1 from public.vehicles v where v.id=vehicle_id and v.status='published' and v.active)
    and exists(select 1 from public.destinations d where d.id=destination_id and d.status='published' and d.active)
  )
  or private.has_role(array['admin','editor']::public.profile_role[])
);
create policy vehicle_destinations_insert on public.vehicle_destinations for insert to authenticated
with check (private.has_role(array['admin','editor']::public.profile_role[]));
create policy vehicle_destinations_update on public.vehicle_destinations for update to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]))
with check (private.has_role(array['admin','editor']::public.profile_role[]));
create policy vehicle_destinations_delete on public.vehicle_destinations for delete to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]));

alter table public.guides add column if not exists nationwide boolean not null default false;

alter table public.homepage_content
  add column if not exists hero_video_url text,
  add column if not exists hero_video_mobile_url text,
  add column if not exists hero_video_poster_url text,
  add column if not exists hero_video_alt text,
  add column if not exists hero_video_overlay_strength numeric not null default 0.58
    check (hero_video_overlay_strength between 0 and 0.9),
  add column if not exists hero_video_enabled boolean not null default false,
  add column if not exists hero_video_autoplay boolean not null default true,
  add column if not exists hero_video_loop boolean not null default true,
  add column if not exists hero_video_muted boolean not null default true;

update public.homepage_content
set hero_video_poster_url=coalesce(hero_video_poster_url,hero_background_image_url),
    hero_video_alt=coalesce(hero_video_alt,hero_image_alt,'Sri Lankan landscape')
where id=true;

update storage.buckets
set file_size_limit=104857600,
    allowed_mime_types=array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm']
where id='travel-content';

commit;
