begin;

alter table public.journey_proposals
  add column if not exists requires_new_version boolean not null default false,
  add column if not exists out_of_date_at timestamptz;

create or replace function private.protect_sent_proposal_snapshot()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  if old.sent_snapshot is not null and (
    new.sent_snapshot is distinct from old.sent_snapshot
    or new.customer_snapshot is distinct from old.customer_snapshot
    or new.allocation_snapshot is distinct from old.allocation_snapshot
    or new.curated_journey_snapshot is distinct from old.curated_journey_snapshot
    or new.commercial_snapshot is distinct from old.commercial_snapshot
    or new.total_supplier_cost is distinct from old.total_supplier_cost
    or new.total_selling_price is distinct from old.total_selling_price
    or new.gross_profit is distinct from old.gross_profit
    or new.profit_margin is distinct from old.profit_margin
    or new.currency is distinct from old.currency
    or new.version is distinct from old.version
    or new.proposal_reference is distinct from old.proposal_reference
  ) then
    raise exception 'A sent proposal snapshot is immutable. Create a new proposal version.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_sent_proposal_snapshot on public.journey_proposals;
create trigger protect_sent_proposal_snapshot
before update on public.journey_proposals
for each row execute function private.protect_sent_proposal_snapshot();

create or replace function private.mark_active_proposal_out_of_date()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  target_enquiry_id uuid;
begin
  if tg_op = 'DELETE' then
    target_enquiry_id := old.enquiry_id;
  else
    target_enquiry_id := new.enquiry_id;
  end if;

  update public.journey_proposals
  set requires_new_version=true,
      out_of_date_at=coalesce(out_of_date_at,now())
  where enquiry_id=target_enquiry_id
    and status in ('ready','internal_approved','sent','viewed','changes_requested')
    and requires_new_version=false;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function private.mark_proposal_after_curated_change()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if new.itinerary is distinct from old.itinerary then
    update public.journey_proposals
    set requires_new_version=true,
        out_of_date_at=coalesce(out_of_date_at,now())
    where enquiry_id=new.enquiry_id
      and status in ('ready','internal_approved','sent','viewed','changes_requested')
      and requires_new_version=false;
  end if;
  return new;
end;
$$;

drop trigger if exists mark_proposal_after_curated_change on public.curated_journeys;
create trigger mark_proposal_after_curated_change
after update of itinerary on public.curated_journeys
for each row execute function private.mark_proposal_after_curated_change();

drop trigger if exists mark_proposal_after_allocation_insert on public.journey_supplier_allocations;
create trigger mark_proposal_after_allocation_insert
after insert on public.journey_supplier_allocations
for each row execute function private.mark_active_proposal_out_of_date();

drop trigger if exists mark_proposal_after_allocation_delete on public.journey_supplier_allocations;
create trigger mark_proposal_after_allocation_delete
after delete on public.journey_supplier_allocations
for each row execute function private.mark_active_proposal_out_of_date();

drop trigger if exists mark_proposal_after_allocation_change on public.journey_supplier_allocations;
create trigger mark_proposal_after_allocation_change
after update of allocation_type,destination_id,from_destination_id,to_destination_id,from_location_key,to_location_key,accommodation_id,guide_id,vehicle_id,experience_id,provider_name,supplier_contact,pricing_plan_id,pricing_plan_snapshot,service_name,quantity,quantity_label,currency,supplier_cost,selling_price,confirmation_status,service_details
on public.journey_supplier_allocations
for each row execute function private.mark_active_proposal_out_of_date();

comment on column public.journey_proposals.requires_new_version is
'True when the curated journey or commercial supplier allocation changed after this proposal version was composed.';
comment on column public.journey_proposals.out_of_date_at is
'First time the proposal version ceased to represent the current curated journey and allocations.';

commit;
