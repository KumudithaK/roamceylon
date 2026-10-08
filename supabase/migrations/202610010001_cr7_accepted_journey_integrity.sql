begin;

-- The submitted enquiry is the immutable original request. Once a traveller
-- accepts a proposal, the accepted curated itinerary is the operational basis.
create or replace function private.guard_accepted_curated_itinerary()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(old.enquiry_id::text,0));
  if new.itinerary is distinct from old.itinerary and exists (
    select 1 from public.journey_proposals proposal
    join public.journey_proposal_acceptances acceptance on acceptance.proposal_id=proposal.id
    where proposal.enquiry_id=old.enquiry_id
  ) then
    raise exception using errcode='55000',message='An accepted journey itinerary cannot be changed without an authorised amendment.';
  end if;
  return new;
end $$;

create trigger curated_journeys_guard_accepted_itinerary
before update of itinerary on public.curated_journeys
for each row execute function private.guard_accepted_curated_itinerary();

-- Do not let a new supplier service silently enter an already accepted journey.
-- Operational notes on existing services remain governed by the existing
-- command, immutable-agreement and audit guards.
create or replace function private.guard_accepted_allocation_insert()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.enquiry_id::text,0));
  if exists (
    select 1 from public.journey_proposals proposal
    join public.journey_proposal_acceptances acceptance on acceptance.proposal_id=proposal.id
    where proposal.enquiry_id=new.enquiry_id
  ) then
    raise exception using errcode='55000',message='An accepted journey cannot gain a supplier service without an authorised amendment.';
  end if;
  return new;
end $$;

create trigger journey_allocations_guard_accepted_insert
before insert on public.journey_supplier_allocations
for each row execute function private.guard_accepted_allocation_insert();

-- A fresh proposal version would make the accepted version non-current and
-- strand operational handover. Amendments need an explicit future workflow.
create or replace function private.guard_accepted_proposal_insert()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.enquiry_id::text,0));
  if exists (
    select 1 from public.journey_proposals proposal
    join public.journey_proposal_acceptances acceptance on acceptance.proposal_id=proposal.id
    where proposal.enquiry_id=new.enquiry_id
  ) then
    raise exception using errcode='55000',message='An accepted journey cannot gain a new proposal without an authorised amendment.';
  end if;
  return new;
end $$;

create trigger journey_proposals_guard_accepted_insert
before insert on public.journey_proposals
for each row execute function private.guard_accepted_proposal_insert();

create or replace function private.assert_journey_operational_readiness(p_enquiry_id uuid)
returns uuid language plpgsql stable security definer set search_path='' as $$
declare enquiry_row public.enquiries%rowtype;proposal_row public.journey_proposals%rowtype;
  curated_row public.curated_journeys%rowtype;line jsonb;allocation public.journey_supplier_allocations%rowtype;
  start_date date;end_date date;accepted_adults integer;accepted_children integer;accepted_infants integer;
begin
  select * into enquiry_row from public.enquiries where id=p_enquiry_id;
  if enquiry_row.id is null then raise exception using errcode='P0002',message='Traveller enquiry not found.';end if;
  proposal_row:=private.accepted_operational_proposal(p_enquiry_id);
  select * into curated_row from public.curated_journeys
    where id=proposal_row.curated_journey_id and enquiry_id=p_enquiry_id;
  if curated_row.id is null then
    raise exception using errcode='23514',message='The accepted Curated Journey does not belong to this enquiry.';
  end if;
  if proposal_row.curated_journey_snapshot is null
    or proposal_row.curated_journey_snapshot is distinct from curated_row.itinerary then
    raise exception using errcode='55000',message='The live Curated Journey differs from the accepted proposal.';
  end if;

  start_date:=nullif(proposal_row.sent_snapshot#>>'{journey,startDate}','')::date;
  end_date:=nullif(proposal_row.sent_snapshot#>>'{journey,endDate}','')::date;
  if start_date is null or end_date is null or end_date<=start_date then
    raise exception using errcode='23514',message='Valid accepted journey dates are required for operational handover.';
  end if;
  if nullif(curated_row.itinerary#>>'{travelDates,start}','')::date is distinct from start_date
    or nullif(curated_row.itinerary#>>'{travelDates,end}','')::date is distinct from end_date then
    raise exception using errcode='23514',message='Operational dates must match the accepted proposal.';
  end if;
  accepted_adults:=nullif(proposal_row.sent_snapshot#>>'{traveller,adults}','')::integer;
  accepted_children:=nullif(proposal_row.sent_snapshot#>>'{traveller,children}','')::integer;
  accepted_infants:=nullif(proposal_row.sent_snapshot#>>'{traveller,infants}','')::integer;
  if accepted_adults is null or accepted_adults<1
    or accepted_children is null or accepted_children<0
    or accepted_infants is null or accepted_infants<0
    or nullif(curated_row.itinerary#>>'{travellerCounts,adults}','')::integer is distinct from accepted_adults
    or nullif(curated_row.itinerary#>>'{travellerCounts,children}','')::integer is distinct from accepted_children
    or nullif(curated_row.itinerary#>>'{travellerCounts,infants}','')::integer is distinct from accepted_infants then
    raise exception using errcode='23514',message='Operational traveller counts must match the accepted proposal.';
  end if;
  if jsonb_typeof(proposal_row.allocation_snapshot) is distinct from 'array'
    or jsonb_array_length(proposal_row.allocation_snapshot)=0 then
    raise exception using errcode='55000',message='The accepted proposal has no authoritative supplier services.';
  end if;
  for line in select value from jsonb_array_elements(proposal_row.allocation_snapshot) loop
    if nullif(line->>'allocationId','') is null then
      raise exception using errcode='23514',message='The accepted proposal contains an invalid supplier allocation reference.';
    end if;
    select * into allocation from public.journey_supplier_allocations where id=(line->>'allocationId')::uuid;
    if allocation.id is null or allocation.enquiry_id<>p_enquiry_id
      or allocation.curated_journey_id is distinct from proposal_row.curated_journey_id then
      raise exception using errcode='23514',message='An accepted supplier service does not belong to this journey.';
    end if;
    if allocation.confirmation_status<>'confirmed' or allocation.review_required then
      raise exception using errcode='55000',message='Every accepted supplier service must be confirmed and current before operational handover.';
    end if;
  end loop;
  return proposal_row.id;
end $$;

revoke all on function private.guard_accepted_curated_itinerary() from public,anon,authenticated;
revoke all on function private.guard_accepted_allocation_insert() from public,anon,authenticated;
revoke all on function private.guard_accepted_proposal_insert() from public,anon,authenticated;
revoke all on function private.assert_journey_operational_readiness(uuid) from public,anon,authenticated;

comment on function private.assert_journey_operational_readiness(uuid) is
  'Uses the immutable accepted proposal and curated snapshot, not original enquiry dates or pax, to authorize operational handover.';

commit;
