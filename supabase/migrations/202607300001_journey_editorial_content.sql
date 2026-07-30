alter table public.themes
  add column if not exists full_description text,
  add column if not exists why_choose jsonb not null default '[]'::jsonb,
  add column if not exists suggested_itinerary jsonb not null default '[]'::jsonb,
  add column if not exists gallery jsonb not null default '[]'::jsonb,
  add column if not exists travel_inspiration text;

alter table public.destinations
  add column if not exists historical_importance text,
  add column if not exists cultural_significance text,
  add column if not exists why_visit text,
  add column if not exists unesco_information text,
  add column if not exists nature_wildlife text,
  add column if not exists local_highlights jsonb not null default '[]'::jsonb,
  add column if not exists best_time_to_visit text,
  add column if not exists weather text,
  add column if not exists nearby_attractions jsonb not null default '[]'::jsonb,
  add column if not exists travel_tips jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='themes_why_choose_array') then
    alter table public.themes add constraint themes_why_choose_array check (jsonb_typeof(why_choose)='array');
  end if;
  if not exists (select 1 from pg_constraint where conname='themes_itinerary_array') then
    alter table public.themes add constraint themes_itinerary_array check (jsonb_typeof(suggested_itinerary)='array');
  end if;
  if not exists (select 1 from pg_constraint where conname='themes_gallery_array') then
    alter table public.themes add constraint themes_gallery_array check (jsonb_typeof(gallery)='array');
  end if;
  if not exists (select 1 from pg_constraint where conname='destinations_local_highlights_array') then
    alter table public.destinations add constraint destinations_local_highlights_array check (jsonb_typeof(local_highlights)='array');
  end if;
  if not exists (select 1 from pg_constraint where conname='destinations_nearby_attractions_array') then
    alter table public.destinations add constraint destinations_nearby_attractions_array check (jsonb_typeof(nearby_attractions)='array');
  end if;
  if not exists (select 1 from pg_constraint where conname='destinations_travel_tips_array') then
    alter table public.destinations add constraint destinations_travel_tips_array check (jsonb_typeof(travel_tips)='array');
  end if;
end $$;
