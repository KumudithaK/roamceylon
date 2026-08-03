begin;

alter table public.guides
add column if not exists gallery jsonb not null default '[]'::jsonb
check (jsonb_typeof(gallery)='array');

commit;
