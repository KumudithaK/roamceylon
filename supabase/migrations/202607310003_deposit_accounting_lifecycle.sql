begin;

alter table public.journey_accounts
  drop constraint if exists journey_accounts_status_check,
  add column journey_reference text,
  add column activated_at timestamptz,
  add column active boolean not null default false,
  add column deactivated_at timestamptz,
  add column review_reason text;

update public.journey_accounts account
set journey_reference=enquiry.journey_reference
from public.enquiries enquiry
where enquiry.id=account.enquiry_id;

update public.journey_accounts account
set
  active=exists(
    select 1 from public.accounting_transactions entry
    where entry.account_id=account.id
  ),
  activated_at=coalesce((
    select min(entry.created_at)
    from public.accounting_transactions entry
    where entry.account_id=account.id
      and entry.transaction_type='customer_receipt'
  ),case when account.amount_received>0 then account.posted_at end),
  deactivated_at=case
    when not exists(
      select 1 from public.accounting_transactions entry
      where entry.account_id=account.id
    ) then now()
    else null
  end,
  status=case account.status
    when 'settled' then 'closed'
    when 'paid' then 'fully_paid'
    when 'part_paid' then 'part_paid'
    when 'void' then 'cancelled'
    else case when account.amount_received>0 then 'part_paid' else 'pending_deposit' end
  end;

alter table public.journey_accounts
  alter column journey_reference set not null,
  add constraint journey_accounts_journey_reference_key unique (journey_reference),
  add constraint journey_accounts_journey_reference_fkey
    foreign key (journey_reference) references public.enquiries(journey_reference)
    on update cascade on delete restrict,
  add constraint journey_accounts_status_check check (status in (
    'pending_deposit',
    'active',
    'review_required',
    'part_paid',
    'fully_paid',
    'cancelled',
    'refund_pending',
    'refunded',
    'closed'
  ));

alter table public.accounting_transactions
  add column idempotency_key text;

create unique index accounting_transactions_idempotency_idx
on public.accounting_transactions(account_id,idempotency_key)
where idempotency_key is not null;

create table public.accounting_lifecycle_history (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.journey_accounts(id) on delete restrict,
  from_status text,
  to_status text not null,
  enquiry_status text,
  reason text not null,
  created_at timestamptz not null default now(),
  changed_by uuid references auth.users(id)
);

create index accounting_lifecycle_history_account_idx
on public.accounting_lifecycle_history(account_id,created_at desc);

alter table public.accounting_lifecycle_history enable row level security;

create policy accounting_lifecycle_history_staff_read
on public.accounting_lifecycle_history
for select to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]));

revoke insert,update,delete on public.accounting_lifecycle_history from anon,authenticated;

insert into public.accounting_lifecycle_history(
  account_id,from_status,to_status,enquiry_status,reason
)
select
  account.id,
  null,
  account.status,
  enquiry.status,
  'Accounting lifecycle baseline established during CRM stabilization.'
from public.journey_accounts account
join public.enquiries enquiry on enquiry.id=account.enquiry_id;

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
begin
  select
    coalesce(sum(amount) filter (where transaction_type='customer_receipt'),0),
    coalesce(sum(amount) filter (where transaction_type='customer_refund'),0),
    coalesce(sum(amount) filter (where transaction_type='supplier_payment'),0)
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

  update public.journey_accounts
  set
    amount_received=greatest(0,received-refunded),
    amount_refunded=refunded,
    supplier_paid=paid_out,
    supplier_savings=savings,
    status=case
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

  select * into account_row
  from public.journey_accounts
  where enquiry_id=new.id;

  if account_row.id is null then return null; end if;

  select
    exists(select 1 from public.accounting_transactions where account_id=account_row.id),
    coalesce(sum(amount) filter (where transaction_type='customer_receipt'),0) -
      coalesce(sum(amount) filter (where transaction_type='customer_refund'),0)
  into has_transactions,net_customer_payments
  from public.accounting_transactions
  where account_id=account_row.id;

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
    if net_customer_payments>0 then
      target_status:='refund_pending';
      target_active:=true;
      target_reason:='Traveller Enquiry cancelled with customer funds held.';
    elsif has_transactions then
      target_status:='cancelled';
      target_active:=true;
      target_reason:='Traveller Enquiry cancelled after financial activity.';
    else
      target_status:='cancelled';
      target_active:=false;
      target_reason:=null;
    end if;
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
      account_row.id,
      account_row.status,
      target_status,
      new.status,
      coalesce(target_reason,'Traveller Enquiry status changed to ' || replace(new.status,'_',' ') || '.'),
      auth.uid()
    );
  end if;
  return null;
end;
$$;

create trigger enquiries_sync_account_lifecycle
after update of status on public.enquiries
for each row execute function private.sync_account_from_enquiry_status();

comment on column public.journey_accounts.active is
'Controls visibility in active Accounting views without deleting the account or its audit history.';
comment on column public.journey_accounts.review_reason is
'Explains lifecycle conflicts such as an enquiry reversal after financial activity.';
comment on column public.accounting_transactions.idempotency_key is
'Prevents duplicate system-generated financial entries such as the initial deposit.';
comment on table public.accounting_lifecycle_history is
'Immutable audit trail for accounting status changes caused by Traveller Enquiry lifecycle transitions.';

commit;
