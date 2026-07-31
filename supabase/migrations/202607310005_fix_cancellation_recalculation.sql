begin;

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
    update public.journey_cancellation_cases cancellation
    set
      customer_paid=received,
      status=case
        when cancellation.status='closed' then 'closed'
        when cancellation.approved_at is null then cancellation.status
        when refunded >= coalesce(cancellation_approved_refund,0) then 'refunded'
        when refunded > 0 then 'part_refunded'
        else 'approved'
      end
    where cancellation.account_id=target_account;
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

commit;
