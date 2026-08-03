begin;

alter table public.experiences
  add column if not exists best_season text,
  add column if not exists highlights jsonb not null default '[]'::jsonb check (jsonb_typeof(highlights)='array'),
  add column if not exists unique_points jsonb not null default '[]'::jsonb check (jsonb_typeof(unique_points)='array'),
  add column if not exists included jsonb not null default '[]'::jsonb check (jsonb_typeof(included)='array'),
  add column if not exists things_to_know jsonb not null default '[]'::jsonb check (jsonb_typeof(things_to_know)='array'),
  add column if not exists nearby_attractions jsonb not null default '[]'::jsonb check (jsonb_typeof(nearby_attractions)='array'),
  add column if not exists traveller_tips jsonb not null default '[]'::jsonb check (jsonb_typeof(traveller_tips)='array'),
  add column if not exists badges jsonb not null default '[]'::jsonb check (jsonb_typeof(badges)='array');

alter table public.enquiries
  add column if not exists experience_participants jsonb not null default '{}'::jsonb
    check (jsonb_typeof(experience_participants)='object');

comment on column public.experiences.highlights is 'Short editorial highlights, one item per visual point.';
comment on column public.experiences.unique_points is 'What makes the experience distinctive without duplicating the main story.';
comment on column public.enquiries.experience_participants is 'Independent adult, child and infant counts keyed by selected experience UUID.';

commit;
