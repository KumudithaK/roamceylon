alter table public.enquiries
  add column estimated_price_min numeric,
  add column estimated_price_max numeric,
  add column estimated_price_currency text,
  add column estimated_price_basis text,
  add column estimated_at timestamptz,
  add column estimate_snapshot jsonb not null default '{}'::jsonb;

alter table public.enquiries
  add constraint enquiries_estimated_price_bounds check (
    (estimated_price_min is null and estimated_price_max is null)
    or (estimated_price_min >= 0 and estimated_price_max >= estimated_price_min)
  ),
  add constraint enquiries_estimated_price_currency check (estimated_price_currency is null or char_length(estimated_price_currency)=3),
  add constraint enquiries_estimated_price_basis check (estimated_price_basis is null or estimated_price_basis in ('per_person','total')),
  add constraint enquiries_estimate_snapshot_object check (jsonb_typeof(estimate_snapshot)='object');

create or replace function private.preserve_submitted_journey_estimate()
returns trigger language plpgsql set search_path=''
as $$
begin
  if old.estimated_at is not null and (
    new.estimated_price_min is distinct from old.estimated_price_min
    or new.estimated_price_max is distinct from old.estimated_price_max
    or new.estimated_price_currency is distinct from old.estimated_price_currency
    or new.estimated_price_basis is distinct from old.estimated_price_basis
    or new.estimated_at is distinct from old.estimated_at
    or new.estimate_snapshot is distinct from old.estimate_snapshot
  ) then
    raise exception 'The traveller estimate captured at submission is immutable.';
  end if;
  return new;
end;
$$;

create trigger enquiries_preserve_submitted_estimate
before update on public.enquiries
for each row execute function private.preserve_submitted_journey_estimate();

comment on column public.enquiries.estimate_snapshot is
  'Immutable informational snapshot of the public journey estimate shown when the traveller submitted the enquiry. It never determines proposal or accounting prices.';

