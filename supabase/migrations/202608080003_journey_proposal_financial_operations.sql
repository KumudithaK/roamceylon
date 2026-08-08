begin;

alter table public.journey_supplier_allocations
  drop constraint if exists journey_supplier_allocations_allocation_type_check,
  drop constraint if exists journey_supplier_allocation_scope,
  add column experience_id uuid references public.experiences(id) on delete restrict,
  add column provider_name text,
  add column supplier_contact text,
  add column supplier_cost numeric check (supplier_cost is null or supplier_cost >= 0),
  add column selling_price numeric check (selling_price is null or selling_price >= 0),
  add column currency text not null default 'USD' check (char_length(currency)=3),
  add column confirmation_status text not null default 'pending'
    check (confirmation_status in ('pending','confirmed','cancelled')),
  add column invoice_status text not null default 'not_requested'
    check (invoice_status in ('not_requested','requested','received','not_required')),
  add column payment_status text not null default 'pending'
    check (payment_status in ('pending','payment_due','paid','cancelled')),
  add column arrival_instructions text,
  add column special_notes text,
  add constraint journey_supplier_allocations_allocation_type_check
    check (allocation_type in ('accommodation','guide','vehicle','experience')),
  add constraint journey_supplier_allocation_scope check (
    (
      allocation_type='accommodation'
      and destination_id is not null
      and from_destination_id is null and to_destination_id is null
      and accommodation_id is not null and guide_id is null and vehicle_id is null and experience_id is null
    ) or (
      allocation_type='guide'
      and destination_id is not null
      and from_destination_id is null and to_destination_id is null
      and accommodation_id is null and guide_id is not null and vehicle_id is null and experience_id is null
    ) or (
      allocation_type='vehicle'
      and destination_id is null
      and from_destination_id is not null and to_destination_id is not null
      and from_destination_id <> to_destination_id
      and accommodation_id is null and guide_id is null and vehicle_id is not null and experience_id is null
    ) or (
      allocation_type='experience'
      and destination_id is not null
      and from_destination_id is null and to_destination_id is null
      and accommodation_id is null and guide_id is null and vehicle_id is null and experience_id is not null
      and nullif(btrim(provider_name),'') is not null
    )
  );

create unique index journey_supplier_experience_allocation_unique
on public.journey_supplier_allocations(enquiry_id,allocation_type,experience_id)
where allocation_type='experience';

alter table public.journey_settlements
  add column allocation_id uuid references public.journey_supplier_allocations(id) on delete restrict;

create unique index journey_settlements_allocation_unique
on public.journey_settlements(account_id,allocation_id)
where allocation_id is not null;

create table public.journey_proposals (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete restrict,
  version integer not null check (version > 0),
  proposal_reference text not null unique,
  status text not null default 'ready'
    check (status in ('ready','sent','approved','superseded','cancelled')),
  currency text not null default 'USD' check (char_length(currency)=3),
  total_supplier_cost numeric not null check (total_supplier_cost >= 0),
  total_selling_price numeric not null check (total_selling_price >= 0),
  gross_profit numeric not null,
  profit_margin numeric not null,
  introduction text,
  terms text,
  valid_until date,
  allocation_snapshot jsonb not null check (jsonb_typeof(allocation_snapshot)='array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  approved_at timestamptz,
  created_by uuid references auth.users(id),
  unique(enquiry_id,version)
);

create index journey_proposals_enquiry_idx
on public.journey_proposals(enquiry_id,version desc);

create trigger journey_proposals_updated_at before update on public.journey_proposals
for each row execute function private.set_updated_at();

alter table public.journey_proposals enable row level security;

create policy journey_proposals_staff_read
on public.journey_proposals for select to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]));

revoke insert,update,delete on public.journey_proposals from anon,authenticated;
grant select on table public.journey_proposals to authenticated;

alter table public.enquiries drop constraint if exists enquiries_status_check;
alter table public.enquiries add constraint enquiries_status_check check (status in (
  'new','under_review','preparing_proposal','proposal_sent',
  'awaiting_traveller_approval','proposal_accepted','deposit_requested','deposit_paid',
  'journey_confirmed','ready_for_operations','travelling','completed','archived','cancelled'
));

create or replace function private.sync_allocation_from_settlement()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if new.allocation_id is not null then
    update public.journey_supplier_allocations
    set payment_status=case
      when new.status in ('paid','waived') then 'paid'
      when new.amount_due-new.amount_paid-new.waived_amount > 0 then 'payment_due'
      else 'pending'
    end,
    updated_at=now()
    where id=new.allocation_id;
  end if;
  return null;
end;
$$;

create trigger journey_settlement_sync_allocation
after insert or update of status,amount_due,amount_paid,waived_amount on public.journey_settlements
for each row execute function private.sync_allocation_from_settlement();

comment on column public.journey_supplier_allocations.supplier_cost is
'Confirmed or estimated total internal supplier cost for this journey allocation.';
comment on column public.journey_supplier_allocations.selling_price is
'Traveller-facing total selling price contributed by this allocation.';
comment on table public.journey_proposals is
'Immutable versioned proposal snapshots generated from supplier allocations, never from mutable traveller preferences.';

commit;
