begin;

alter table public.enquiries
  add column journey_reference text;

update public.enquiries
set journey_reference =
  'RCJ-' || to_char(created_at,'YYYY') || '-' ||
  upper(substr(replace(id::text,'-',''),1,8))
where journey_reference is null;

alter table public.enquiries
  alter column journey_reference set default (
    'RCJ-' || to_char(current_date,'YYYY') || '-' ||
    upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))
  ),
  alter column journey_reference set not null,
  add constraint enquiries_journey_reference_key unique (journey_reference);

alter table public.enquiries
  drop constraint if exists enquiries_status_check;

update public.enquiries
set status=case status
  when 'contacted' then 'under_review'
  when 'quote_preparing' then 'preparing_proposal'
  when 'quote_sent' then 'proposal_sent'
  when 'confirmed' then 'journey_confirmed'
  when 'closed' then 'completed'
  else status
end;

insert into public.enquiries (
  journey_reference,
  created_at,
  updated_at,
  name,
  email,
  phone,
  nationality,
  summary,
  trip_state,
  status,
  travel_start_date,
  travel_end_date,
  adults,
  children,
  selected_themes,
  selected_destinations,
  selected_experiences,
  experience_participants,
  selected_stays,
  selected_vehicle,
  selected_guide,
  traveller_notes,
  internal_notes
)
select
  request.journey_reference,
  request.created_at,
  request.updated_at,
  request.customer_name,
  request.email_address,
  request.whatsapp_number,
  request.country,
  'Personalised journey requested.',
  request.journey_snapshot,
  case request.status
    when 'preparing_proposal' then 'preparing_proposal'
    when 'proposal_sent' then 'proposal_sent'
    when 'accepted' then 'proposal_accepted'
    when 'cancelled' then 'cancelled'
    else 'new'
  end,
  request.arrival_date,
  request.departure_date,
  greatest(1,coalesce((request.journey_snapshot #>> '{state,travellerCounts,adults}')::integer,1)),
  greatest(0,coalesce((request.journey_snapshot #>> '{state,travellerCounts,children}')::integer,0)),
  coalesce(request.journey_snapshot #> '{state,selectedThemeIds}','[]'::jsonb),
  coalesce(request.journey_snapshot #> '{state,selectedDestinationIds}','[]'::jsonb),
  coalesce(request.journey_snapshot #> '{state,selectedExperienceIds}','[]'::jsonb),
  coalesce(request.journey_snapshot #> '{state,experienceParticipants}','{}'::jsonb),
  (
    select coalesce(jsonb_agg(stay.value),'[]'::jsonb)
    from jsonb_each(coalesce(request.journey_snapshot #> '{state,selectedStayIdsByDestination}','{}'::jsonb)) stay
    where stay.value <> 'null'::jsonb and stay.value <> '""'::jsonb
  ),
  nullif(request.journey_snapshot #>> '{state,selectedVehicleId}',''),
  nullif(request.journey_snapshot #>> '{state,selectedGuideId}',''),
  request.special_requests,
  null
from public.journey_requests request
on conflict (journey_reference) do nothing;

alter table public.enquiries
  add constraint enquiries_status_check check (status in (
    'new',
    'under_review',
    'preparing_proposal',
    'proposal_sent',
    'awaiting_traveller_approval',
    'proposal_accepted',
    'deposit_requested',
    'deposit_paid',
    'journey_confirmed',
    'travelling',
    'completed',
    'cancelled'
  ));

comment on column public.enquiries.journey_reference is
'Stable traveller-facing Journey ID used across CRM, proposals, payments, documents and accounting.';

drop table public.journey_requests;

commit;
