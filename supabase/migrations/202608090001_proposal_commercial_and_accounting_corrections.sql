begin;

alter table public.journey_proposals
  add column if not exists commercial_snapshot jsonb not null default '{}'::jsonb
  check (jsonb_typeof(commercial_snapshot)='object');

alter table public.journey_accounts
  add column if not exists closure_adjustment numeric not null default 0 check (closure_adjustment >= 0),
  add column if not exists closure_reason text,
  add column if not exists manually_closed_at timestamptz,
  add column if not exists manually_closed_by uuid references auth.users(id);

-- Legacy accommodation "per_person" rates were incorrectly stored as room nights.
-- Correct mutable allocation drafts only; immutable proposal snapshots are intentionally untouched.
with corrected as (
  select allocation.id,plan.price,
    greatest(1,case when allocation.service_details->>'guests' ~ '^[0-9]+([.][0-9]+)?$' then (allocation.service_details->>'guests')::numeric else 1 end)
    * greatest(1,case when allocation.service_details->>'nights' ~ '^[0-9]+([.][0-9]+)?$' then (allocation.service_details->>'nights')::numeric else 1 end) as billable_quantity
  from public.journey_supplier_allocations allocation
  join public.pricing_plans plan on plan.id=allocation.pricing_plan_id
  where allocation.allocation_type='accommodation' and plan.charging_method='per_person'
)
update public.journey_supplier_allocations allocation set
  quantity=corrected.billable_quantity,
  quantity_label='guest nights',
  supplier_cost=corrected.price*corrected.billable_quantity,
  selling_price=case when allocation.selling_price is not null and allocation.selling_price>=corrected.price*corrected.billable_quantity then allocation.selling_price else null end,
  updated_at=now()
from corrected where corrected.id=allocation.id;

alter table public.accounting_transactions
  drop constraint if exists accounting_transactions_transaction_type_check,
  drop constraint if exists accounting_transactions_settlement_check,
  add constraint accounting_transactions_transaction_type_check check (transaction_type in (
    'customer_receipt','customer_refund','supplier_payment','supplier_waiver','supplier_recovery',
    'supplier_payment_reversal','supplier_waiver_reversal'
  )),
  add constraint accounting_transactions_settlement_check check (
    (transaction_type in ('supplier_payment','supplier_waiver','supplier_recovery','supplier_payment_reversal','supplier_waiver_reversal') and settlement_id is not null)
    or (transaction_type in ('customer_receipt','customer_refund') and settlement_id is null)
  );

create or replace function private.recalculate_journey_account(target_account uuid)
returns void language plpgsql security definer set search_path='' as $$
declare
  received numeric; refunded numeric; paid_out numeric; savings numeric;
  settlement_due numeric; settlement_resolved numeric; selling numeric; closure numeric;
  current_status text; account_active boolean; cancellation_status text;
  cancellation_outcome text; cancellation_approved_refund numeric;
begin
  select
    coalesce(sum(amount) filter (where transaction_type='customer_receipt'),0),
    coalesce(sum(amount) filter (where transaction_type='customer_refund'),0),
    greatest(0,
      coalesce(sum(amount) filter (where transaction_type='supplier_payment'),0)
      - coalesce(sum(amount) filter (where transaction_type in ('supplier_recovery','supplier_payment_reversal')),0)
    )
  into received,refunded,paid_out
  from public.accounting_transactions where account_id=target_account;

  select coalesce(sum(amount_due),0),coalesce(sum(amount_paid+waived_amount),0),coalesce(sum(waived_amount),0)
  into settlement_due,settlement_resolved,savings from public.journey_settlements where account_id=target_account;

  select selling_price,closure_adjustment,status,active into selling,closure,current_status,account_active
  from public.journey_accounts where id=target_account;

  select cancellation.status,cancellation.outcome,cancellation.approved_refund
  into cancellation_status,cancellation_outcome,cancellation_approved_refund
  from public.journey_cancellation_cases cancellation where cancellation.account_id=target_account;

  if cancellation_status is not null then
    update public.journey_cancellation_cases cancellation set
      customer_paid=case when cancellation.assessment_locked_at is null then received else cancellation.customer_paid end,
      status=case when cancellation.outcome is distinct from 'refund' then cancellation.status when cancellation.status='closed' then 'closed'
        when cancellation.approved_at is null then cancellation.status when refunded>=coalesce(cancellation_approved_refund,0) then 'refunded'
        when refunded>0 then 'part_refunded' else 'approved' end
    where cancellation.account_id=target_account;
  end if;

  update public.journey_accounts set
    amount_received=greatest(0,received-refunded),amount_refunded=refunded,supplier_paid=paid_out,supplier_savings=savings,
    status=case
      when current_status='closed' and manually_closed_at is not null then 'closed'
      when cancellation_status is not null and cancellation_outcome='refund' and cancellation_status='closed' then 'refunded'
      when cancellation_status is not null and cancellation_outcome='refund' and cancellation_approved_refund is not null and refunded>=cancellation_approved_refund then 'refunded'
      when cancellation_status is not null and cancellation_outcome='refund' then 'refund_pending'
      when cancellation_status is not null then 'cancelled'
      when current_status='review_required' then 'review_required'
      when current_status in ('cancelled','refund_pending') and received-refunded<=0 and refunded>0 then 'refunded'
      when current_status in ('cancelled','refund_pending') and received-refunded>0 then 'refund_pending'
      when current_status='refunded' and received-refunded<=0 then 'refunded'
      when not account_active then 'pending_deposit'
      when received-refunded>=greatest(0,selling-closure) and settlement_resolved>=settlement_due then 'closed'
      when received-refunded>=greatest(0,selling-closure) then 'fully_paid'
      when received-refunded>0 then 'part_paid' else 'active' end,
    settled_at=case when current_status='closed' and manually_closed_at is not null then coalesce(settled_at,manually_closed_at)
      when received-refunded>=greatest(0,selling-closure) and settlement_resolved>=settlement_due
        and current_status not in ('review_required','cancelled','refund_pending','refunded') then coalesce(settled_at,now()) else null end
  where id=target_account;
end;
$$;

create or replace function private.refresh_journey_account()
returns trigger language plpgsql security definer set search_path='' as $$
declare target_account uuid:=coalesce(new.account_id,old.account_id);target_settlement uuid:=coalesce(new.settlement_id,old.settlement_id);
begin
  if target_settlement is not null then
    update public.journey_settlements set amount_paid=greatest(0,
      coalesce((select sum(amount) from public.accounting_transactions where settlement_id=target_settlement and transaction_type='supplier_payment'),0)
      -coalesce((select sum(amount) from public.accounting_transactions where settlement_id=target_settlement and transaction_type in ('supplier_recovery','supplier_payment_reversal')),0)
    ) where id=target_settlement;
  end if;
  perform private.recalculate_journey_account(target_account);return null;
end;
$$;

comment on column public.journey_proposals.commercial_snapshot is 'Immutable DMC operations, fee, contingency and margin calculation used for this proposal version.';
comment on column public.journey_accounts.closure_adjustment is 'Audited non-cash credit or write-off applied when an authorised administrator closes a residual traveller balance.';
comment on column public.journey_accounts.closure_reason is 'Required explanation for an authorised manual account closure.';

commit;
