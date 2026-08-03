begin;

alter table public.tour_pricing_config
add column route_distance_buffer_percent numeric not null default 0
check (route_distance_buffer_percent between 0 and 100);

comment on column public.tour_pricing_config.route_distance_buffer_percent is
  'Operational distance allowance applied to route-based supplier and fuel costs, for diversions and local running.';

commit;
