begin;

alter table public.journey_settlements
  add column cancellation_resolution text not null default 'not_reviewed'
    check (cancellation_resolution in (
      'not_reviewed','cancelled_without_cost','recoverable','waived','non_recoverable'
    )),
  add column cancellation_non_recoverable_amount numeric not null default 0
    check (cancellation_non_recoverable_amount >= 0),
  add column cancellation_notes text,
  add column cancellation_reviewed_at timestamptz,
  add column cancellation_reviewed_by uuid references auth.users(id),
  add constraint journey_settlements_cancellation_cost_within_due
    check (cancellation_non_recoverable_amount <= amount_due + 0.01);

create table public.journey_cancellation_cases (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references public.journey_accounts(id) on delete restrict,
  status text not null default 'assessment'
    check (status in ('assessment','calculated','approved','part_refunded','refunded','closed')),
  currency text not null default 'USD',
  customer_paid numeric not null default 0 check (customer_paid >= 0),
  supplier_non_recoverable numeric not null default 0 check (supplier_non_recoverable >= 0),
  cancellation_fee numeric not null default 0 check (cancellation_fee >= 0),
  other_non_recoverable_cost numeric not null default 0 check (other_non_recoverable_cost >= 0),
  calculated_refund numeric not null default 0 check (calculated_refund >= 0),
  approved_refund numeric check (approved_refund >= 0),
  calculation_notes text,
  requested_at timestamptz not null default now(),
  calculated_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  closed_at timestamptz,
  closed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index journey_cancellation_cases_status_idx
on public.journey_cancellation_cases(status,requested_at desc);

create trigger journey_cancellation_cases_updated_at
before update on public.journey_cancellation_cases
for each row execute function private.set_updated_at();

alter table public.journey_cancellation_cases enable row level security;

create policy journey_cancellation_cases_staff_read
on public.journey_cancellation_cases
for select to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]));

revoke insert,update,delete on public.journey_cancellation_cases from anon,authenticated;

alter table public.accounting_transactions
  drop constraint if exists accounting_transactions_transaction_type_check,
  drop constraint if exists accounting_transactions_settlement_check,
  add constraint accounting_transactions_transaction_type_check
    check (transaction_type in (
      'customer_receipt','customer_refund','supplier_payment','supplier_waiver','supplier_recovery'
    )),
  add constraint accounting_transactions_settlement_check
    check (
      (transaction_type in ('supplier_payment','supplier_waiver','supplier_recovery') and settlement_id is not null) or
      (transaction_type in ('customer_receipt','customer_refund') and settlement_id is null)
    );

create or replace function private.recalculate_journey_account(target_account uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  received numeric;
  refunded numeric;
  paid_out numeric;
  savings numeric;
  settlement_due numeric;
  settlement_resolved numeric;
  selling numeric;
  current_status text;
  account_active boolean;
  cancellation_status text;
  cancellation_approved_refund numeric;
begin
  select
    coalesce(sum(amount) filter (where transaction_type='customer_receipt'),0),
    coalesce(sum(amount) filter (where transaction_type='customer_refund'),0),
    greatest(0,
      coalesce(sum(amount) filter (where transaction_type='supplier_payment'),0) -
      coalesce(sum(amount) filter (where transaction_type='supplier_recovery'),0)
    )
  into received,refunded,paid_out
  from public.accounting_transactions
  where account_id=target_account;

  select
    coalesce(sum(amount_due),0),
    coalesce(sum(amount_paid + waived_amount),0),
    coalesce(sum(waived_amount),0)
  into settlement_due,settlement_resolved,savings
  from public.journey_settlements
  where account_id=target_account;

  select selling_price,status,active
  into selling,current_status,account_active
  from public.journey_accounts
  where id=target_account;

  select cancellation.status,cancellation.approved_refund
  into cancellation_status,cancellation_approved_refund
  from public.journey_cancellation_cases cancellation
  where cancellation.account_id=target_account;

  if cancellation_status is not null then
    update public.journey_cancellation_cases
    set
      customer_paid=received,
      status=case
        when status='closed' then 'closed'
        when approved_at is null then status
        when refunded >= coalesce(cancellation_approved_refund,0) then 'refunded'
        when refunded > 0 then 'part_refunded'
        else 'approved'
      end
    where account_id=target_account;
  end if;

  update public.journey_accounts
  set
    amount_received=greatest(0,received-refunded),
    amount_refunded=refunded,
    supplier_paid=paid_out,
    supplier_savings=savings,
    status=case
      when cancellation_status is not null and cancellation_status='closed' then 'refunded'
      when cancellation_status is not null and cancellation_approved_refund is not null and refunded>=cancellation_approved_refund then 'refunded'
      when cancellation_status is not null then 'refund_pending'
      when current_status='review_required' then 'review_required'
      when current_status in ('cancelled','refund_pending') and received-refunded<=0 and refunded>0 then 'refunded'
      when current_status in ('cancelled','refund_pending') and received-refunded>0 then 'refund_pending'
      when current_status='refunded' and received-refunded<=0 then 'refunded'
      when not account_active then 'pending_deposit'
      when received-refunded>=selling and settlement_resolved>=settlement_due then 'closed'
      when received-refunded>=selling then 'fully_paid'
      when received-refunded>0 then 'part_paid'
      else 'active'
    end,
    settled_at=case
      when received-refunded>=selling and settlement_resolved>=settlement_due
        and current_status not in ('review_required','cancelled','refund_pending','refunded')
      then coalesce(settled_at,now())
      else null
    end
  where id=target_account;
end;
$$;

create or replace function private.refresh_journey_account()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  target_account uuid := coalesce(new.account_id,old.account_id);
  target_settlement uuid := coalesce(new.settlement_id,old.settlement_id);
begin
  if target_settlement is not null then
    update public.journey_settlements
    set amount_paid=greatest(0,
      coalesce((
        select sum(entry.amount)
        from public.accounting_transactions entry
        where entry.settlement_id=target_settlement
          and entry.transaction_type='supplier_payment'
      ),0)-coalesce((
        select sum(entry.amount)
        from public.accounting_transactions entry
        where entry.settlement_id=target_settlement
          and entry.transaction_type='supplier_recovery'
      ),0)
    )
    where id=target_settlement;
  end if;
  perform private.recalculate_journey_account(target_account);
  return null;
end;
$$;

create or replace function private.open_journey_cancellation_case()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  account_row public.journey_accounts%rowtype;
  paid numeric;
begin
  if new.status<>'cancelled' or old.status='cancelled' then return null; end if;
  select * into account_row from public.journey_accounts where enquiry_id=new.id;
  if account_row.id is null or not account_row.active then return null; end if;
  select coalesce(sum(amount) filter (where transaction_type='customer_receipt'),0)
  into paid from public.accounting_transactions where account_id=account_row.id;
  insert into public.journey_cancellation_cases(account_id,currency,customer_paid)
  values(account_row.id,account_row.currency,paid)
  on conflict(account_id) do nothing;
  return null;
end;
$$;

create trigger enquiries_open_cancellation_case
after update of status on public.enquiries
for each row execute function private.open_journey_cancellation_case();

insert into public.journey_cancellation_cases(account_id,currency,customer_paid)
select
  account.id,
  account.currency,
  coalesce(sum(entry.amount) filter (where entry.transaction_type='customer_receipt'),0)
from public.journey_accounts account
join public.enquiries enquiry on enquiry.id=account.enquiry_id and enquiry.status='cancelled'
left join public.accounting_transactions entry on entry.account_id=account.id
where account.active
group by account.id,account.currency
on conflict(account_id) do nothing;

comment on table public.journey_cancellation_cases is
  'Controlled refund assessment, approval, payment, and closure for a cancelled traveller journey.';
comment on column public.journey_settlements.cancellation_resolution is
  'Supplier obligation outcome used to calculate a cancellation refund; separate from normal settlement status.';
comment on column public.journey_settlements.cancellation_non_recoverable_amount is
  'Final supplier cost retained or payable after cancellation. Only this amount reduces the traveller refund.';

commit;
