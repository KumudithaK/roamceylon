begin;

alter table public.journey_cancellation_cases
  drop constraint if exists journey_cancellation_cases_status_check,
  add column outcome text check (outcome in ('refund','credit_note','rebook','no_refund')),
  add column assessment_date date,
  add column assessed_by uuid references auth.users(id),
  add column cancellation_reason text,
  add column policy_used text,
  add column supplier_exposure numeric not null default 0 check (supplier_exposure >= 0),
  add column supplier_recoverable numeric not null default 0 check (supplier_recoverable >= 0),
  add column admin_charge numeric not null default 0 check (admin_charge >= 0),
  add column recommended_refund numeric not null default 0 check (recommended_refund >= 0),
  add column assessment_locked_at timestamptz,
  add constraint journey_cancellation_cases_status_check check (status in (
    'assessment','decision_recorded','calculated','approved','part_refunded','refunded','closed'
  ));

update public.journey_cancellation_cases cancellation
set
  outcome=case when cancellation.status<>'assessment' then 'refund' else null end,
  assessment_date=case when cancellation.status<>'assessment' then coalesce(cancellation.calculated_at,cancellation.created_at)::date else null end,
  assessed_by=case when cancellation.status<>'assessment' then cancellation.approved_by else null end,
  supplier_exposure=coalesce((
    select sum(settlement.amount_due)
    from public.journey_settlements settlement
    where settlement.account_id=cancellation.account_id
  ),0),
  supplier_recoverable=coalesce((
    select sum(greatest(0,settlement.amount_due-settlement.cancellation_non_recoverable_amount))
    from public.journey_settlements settlement
    where settlement.account_id=cancellation.account_id
      and settlement.cancellation_resolution<>'not_reviewed'
  ),0),
  recommended_refund=case when cancellation.status<>'assessment' then cancellation.calculated_refund else 0 end,
  assessment_locked_at=case when cancellation.status<>'assessment' then coalesce(cancellation.calculated_at,cancellation.approved_at,cancellation.updated_at) else null end;

create table public.supplier_recoverability_history (
  id uuid primary key default gen_random_uuid(),
  cancellation_case_id uuid not null references public.journey_cancellation_cases(id) on delete restrict,
  settlement_id uuid not null references public.journey_settlements(id) on delete restrict,
  from_resolution text,
  to_resolution text not null,
  from_non_recoverable_amount numeric not null default 0,
  to_non_recoverable_amount numeric not null default 0,
  reason text not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id)
);

create index supplier_recoverability_history_case_idx
on public.supplier_recoverability_history(cancellation_case_id,changed_at desc);

alter table public.supplier_recoverability_history enable row level security;

create policy supplier_recoverability_history_staff_read
on public.supplier_recoverability_history
for select to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]));

revoke insert,update,delete on public.supplier_recoverability_history from anon,authenticated;

create or replace function private.audit_supplier_recoverability_change()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  cancellation_id uuid;
begin
  if new.cancellation_resolution is not distinct from old.cancellation_resolution
    and new.cancellation_non_recoverable_amount is not distinct from old.cancellation_non_recoverable_amount
  then return null; end if;
  select cancellation.id into cancellation_id
  from public.journey_cancellation_cases cancellation
  where cancellation.account_id=new.account_id;
  if cancellation_id is null then return null; end if;
  insert into public.supplier_recoverability_history(
    cancellation_case_id,settlement_id,from_resolution,to_resolution,
    from_non_recoverable_amount,to_non_recoverable_amount,reason,changed_by
  ) values (
    cancellation_id,new.id,old.cancellation_resolution,new.cancellation_resolution,
    old.cancellation_non_recoverable_amount,new.cancellation_non_recoverable_amount,
    coalesce(nullif(new.cancellation_notes,''),'Supplier recoverability decision updated.'),
    new.cancellation_reviewed_by
  );
  return null;
end;
$$;

create trigger journey_settlements_audit_recoverability
after update of cancellation_resolution,cancellation_non_recoverable_amount on public.journey_settlements
for each row execute function private.audit_supplier_recoverability_change();

create or replace function private.protect_completed_cancellation_assessment()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  if old.assessment_locked_at is not null and (
    new.outcome is distinct from old.outcome or
    new.assessment_date is distinct from old.assessment_date or
    new.assessed_by is distinct from old.assessed_by or
    new.cancellation_reason is distinct from old.cancellation_reason or
    new.policy_used is distinct from old.policy_used or
    new.customer_paid is distinct from old.customer_paid or
    new.supplier_exposure is distinct from old.supplier_exposure or
    new.supplier_recoverable is distinct from old.supplier_recoverable or
    new.supplier_non_recoverable is distinct from old.supplier_non_recoverable or
    new.cancellation_fee is distinct from old.cancellation_fee or
    new.admin_charge is distinct from old.admin_charge or
    new.other_non_recoverable_cost is distinct from old.other_non_recoverable_cost or
    new.recommended_refund is distinct from old.recommended_refund or
    new.calculated_refund is distinct from old.calculated_refund or
    new.calculation_notes is distinct from old.calculation_notes or
    new.assessment_locked_at is distinct from old.assessment_locked_at
  ) then
    raise exception 'Completed cancellation assessments are immutable.' using errcode='23514';
  end if;
  return new;
end;
$$;

create trigger journey_cancellation_cases_protect_assessment
before update on public.journey_cancellation_cases
for each row execute function private.protect_completed_cancellation_assessment();

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
  cancellation_outcome text;
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

  select cancellation.status,cancellation.outcome,cancellation.approved_refund
  into cancellation_status,cancellation_outcome,cancellation_approved_refund
  from public.journey_cancellation_cases cancellation
  where cancellation.account_id=target_account;

  if cancellation_status is not null then
    update public.journey_cancellation_cases cancellation
    set
      customer_paid=case when cancellation.assessment_locked_at is null then received else cancellation.customer_paid end,
      status=case
        when cancellation.outcome is distinct from 'refund' then cancellation.status
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
      when cancellation_status is not null and cancellation_outcome='refund' and cancellation_status='closed' then 'refunded'
      when cancellation_status is not null and cancellation_outcome='refund' and cancellation_approved_refund is not null and refunded>=cancellation_approved_refund then 'refunded'
      when cancellation_status is not null and cancellation_outcome='refund' then 'refund_pending'
      when cancellation_status is not null then 'cancelled'
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

create or replace function private.sync_account_from_enquiry_status()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  account_row public.journey_accounts%rowtype;
  has_transactions boolean;
  net_customer_payments numeric;
  target_status text;
  target_active boolean;
  target_reason text;
begin
  if new.status=old.status then return null; end if;
  select * into account_row from public.journey_accounts where enquiry_id=new.id;
  if account_row.id is null then return null; end if;

  select
    exists(select 1 from public.accounting_transactions where account_id=account_row.id),
    coalesce(sum(amount) filter (where transaction_type='customer_receipt'),0) -
      coalesce(sum(amount) filter (where transaction_type='customer_refund'),0)
  into has_transactions,net_customer_payments
  from public.accounting_transactions where account_id=account_row.id;

  target_status:=account_row.status;
  target_active:=account_row.active;
  target_reason:=account_row.review_reason;

  if new.status in (
    'new','under_review','preparing_proposal','proposal_sent',
    'awaiting_traveller_approval','proposal_accepted','deposit_requested'
  ) then
    if has_transactions then
      target_status:='review_required';
      target_active:=true;
      target_reason:='Traveller Enquiry reverted to ' || replace(new.status,'_',' ') || ' after financial activity.';
    else
      target_status:='pending_deposit';
      target_active:=false;
      target_reason:=null;
    end if;
  elsif new.status='cancelled' then
    target_status:='cancelled';
    target_active:=has_transactions or net_customer_payments>0;
    target_reason:=case when target_active then 'Traveller Enquiry cancelled. Cancellation assessment required.' else null end;
  elsif new.status in ('deposit_paid','journey_confirmed','travelling','completed') then
    if exists(
      select 1 from public.accounting_transactions
      where account_id=account_row.id and transaction_type='customer_receipt'
    ) then
      target_active:=true;
      target_reason:=null;
      update public.journey_accounts
      set active=true,deactivated_at=null,review_reason=null,
        status=case when status='review_required' then 'active' else status end
      where id=account_row.id;
      perform private.recalculate_journey_account(account_row.id);
      select status,active,review_reason
      into target_status,target_active,target_reason
      from public.journey_accounts where id=account_row.id;
    end if;
  end if;

  update public.journey_accounts
  set
    status=target_status,
    active=target_active,
    deactivated_at=case when target_active then null else coalesce(deactivated_at,now()) end,
    review_reason=target_reason
  where id=account_row.id;

  if account_row.status is distinct from target_status
    or account_row.active is distinct from target_active
    or account_row.review_reason is distinct from target_reason
  then
    insert into public.accounting_lifecycle_history(
      account_id,from_status,to_status,enquiry_status,reason,changed_by
    ) values (
      account_row.id,account_row.status,target_status,new.status,
      coalesce(target_reason,'Traveller Enquiry status changed to ' || replace(new.status,'_',' ') || '.'),auth.uid()
    );
  end if;
  return null;
end;
$$;

update public.journey_accounts account
set status='cancelled'
from public.journey_cancellation_cases cancellation
where cancellation.account_id=account.id and cancellation.outcome is null;

comment on table public.journey_cancellation_cases is
  'Immutable cancellation decision snapshot. Refund is one possible outcome and continues through the existing approval workflow.';
comment on table public.supplier_recoverability_history is
  'Auditable timeline of every supplier recoverability decision made before a cancellation assessment is completed.';

commit;
