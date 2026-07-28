begin;

alter table public.journey_accounts
  add column supplier_savings numeric not null default 0 check (supplier_savings >= 0);

alter table public.journey_settlements
  add column waived_amount numeric not null default 0 check (waived_amount >= 0),
  add column waiver_reason text,
  add constraint journey_settlements_amounts_within_due
    check (amount_paid + waived_amount <= amount_due + 0.01);

alter table public.accounting_transactions
  drop constraint if exists accounting_transactions_transaction_type_check,
  drop constraint if exists accounting_transactions_check,
  add constraint accounting_transactions_transaction_type_check
    check (transaction_type in ('customer_receipt','customer_refund','supplier_payment','supplier_waiver')),
  add constraint accounting_transactions_settlement_check
    check (
      (transaction_type in ('supplier_payment','supplier_waiver') and settlement_id is not null) or
      (transaction_type in ('customer_receipt','customer_refund') and settlement_id is null)
    );

create table public.accounting_attachments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.journey_accounts(id) on delete restrict,
  settlement_id uuid not null references public.journey_settlements(id) on delete restrict,
  transaction_id uuid not null references public.accounting_transactions(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  file_size integer not null check (file_size > 0),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index accounting_attachments_account_idx on public.accounting_attachments(account_id);
create index accounting_attachments_transaction_idx on public.accounting_attachments(transaction_id);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'accounting-receipts',
  'accounting-receipts',
  false,
  10485760,
  array['application/pdf','image/jpeg','image/png','image/webp']
)
on conflict(id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

create or replace function private.set_journey_settlement_status()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  if new.waived_amount >= new.amount_due and new.amount_paid = 0 then
    new.status := 'waived';
  elsif new.amount_paid + new.waived_amount >= new.amount_due then
    new.status := 'paid';
  elsif new.amount_paid + new.waived_amount > 0 then
    new.status := 'part_paid';
  else
    new.status := 'pending';
  end if;
  return new;
end;
$$;

create trigger journey_settlements_set_status
before insert or update of amount_due,amount_paid,waived_amount on public.journey_settlements
for each row execute function private.set_journey_settlement_status();

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

  select selling_price,status into selling,current_status
  from public.journey_accounts
  where id=target_account;

  update public.journey_accounts
  set
    amount_received=greatest(0,received-refunded),
    amount_refunded=refunded,
    supplier_paid=paid_out,
    supplier_savings=savings,
    status=case
      when current_status='void' then 'void'
      when received-refunded>=selling and settlement_resolved>=settlement_due then 'settled'
      when received-refunded>=selling then 'paid'
      when received-refunded>0 then 'part_paid'
      else 'open'
    end,
    settled_at=case
      when received-refunded>=selling and settlement_resolved>=settlement_due then coalesce(settled_at,now())
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
    set amount_paid=coalesce((
      select sum(entry.amount)
      from public.accounting_transactions entry
      where entry.settlement_id=target_settlement
        and entry.transaction_type='supplier_payment'
    ),0)
    where id=target_settlement;
  end if;
  perform private.recalculate_journey_account(target_account);
  return null;
end;
$$;

create or replace function private.refresh_account_after_settlement()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  perform private.recalculate_journey_account(coalesce(new.account_id,old.account_id));
  return null;
end;
$$;

alter table public.accounting_attachments enable row level security;

create policy accounting_attachments_staff_read on public.accounting_attachments
for select to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]));

create policy accounting_receipts_staff_read on storage.objects
for select to authenticated
using (
  bucket_id='accounting-receipts' and
  private.has_role(array['admin','editor']::public.profile_role[])
);

revoke insert,update,delete on public.accounting_attachments from anon,authenticated;

comment on column public.journey_settlements.waived_amount is
  'Supplier courtesy reduction. This lowers realized journey cost and increases realized Roam Ceylon profit.';
comment on table public.accounting_attachments is
  'Private proof-of-payment files attached to a specific supplier-payment transaction.';

commit;
