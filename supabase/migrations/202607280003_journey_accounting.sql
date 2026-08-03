begin;

create sequence if not exists public.journey_account_number_seq;

create table public.journey_accounts (
  id uuid primary key default gen_random_uuid(),
  account_number text not null unique default (
    'RC-' || to_char(current_date,'YYYY') || '-' ||
    lpad(nextval('public.journey_account_number_seq')::text,5,'0')
  ),
  enquiry_id uuid not null unique references public.enquiries(id) on delete restrict,
  traveller_name text not null,
  traveller_email text not null,
  status text not null default 'open'
    check (status in ('open','part_paid','paid','settled','void')),
  currency text not null default 'USD',
  selling_price numeric not null check (selling_price >= 0),
  internal_cost numeric not null check (internal_cost >= 0),
  gross_profit numeric not null,
  profit_margin numeric not null,
  amount_received numeric not null default 0 check (amount_received >= 0),
  amount_refunded numeric not null default 0 check (amount_refunded >= 0),
  supplier_paid numeric not null default 0 check (supplier_paid >= 0),
  travel_start_date date,
  travel_end_date date,
  quote_snapshot jsonb not null,
  posted_at timestamptz not null default now(),
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table public.journey_settlements (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.journey_accounts(id) on delete cascade,
  source_key text not null,
  payee_type text not null
    check (payee_type in ('accommodation','vehicle','guide','experience','destination','operations','other')),
  entity_id uuid,
  payee_name text not null,
  description text,
  currency text not null default 'USD',
  amount_due numeric not null check (amount_due >= 0),
  amount_paid numeric not null default 0 check (amount_paid >= 0),
  due_date date,
  status text not null default 'pending'
    check (status in ('pending','part_paid','paid','waived')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(account_id,source_key)
);

create table public.accounting_transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.journey_accounts(id) on delete restrict,
  settlement_id uuid references public.journey_settlements(id) on delete restrict,
  transaction_type text not null
    check (transaction_type in ('customer_receipt','customer_refund','supplier_payment')),
  amount numeric not null check (amount > 0),
  currency text not null default 'USD',
  payment_date date not null default current_date,
  payment_method text,
  reference text,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  check (
    (transaction_type='supplier_payment' and settlement_id is not null) or
    (transaction_type in ('customer_receipt','customer_refund') and settlement_id is null)
  )
);

create index journey_accounts_status_idx on public.journey_accounts(status,posted_at desc);
create index journey_accounts_travel_idx on public.journey_accounts(travel_start_date);
create index journey_settlements_status_idx on public.journey_settlements(status,due_date);
create index journey_settlements_account_idx on public.journey_settlements(account_id);
create index accounting_transactions_account_idx on public.accounting_transactions(account_id,payment_date desc);
create index accounting_transactions_settlement_idx on public.accounting_transactions(settlement_id);

create trigger journey_accounts_updated_at before update on public.journey_accounts
for each row execute function private.set_updated_at();
create trigger journey_settlements_updated_at before update on public.journey_settlements
for each row execute function private.set_updated_at();

create or replace function private.refresh_journey_account()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  target_account uuid := coalesce(new.account_id,old.account_id);
  target_settlement uuid := coalesce(new.settlement_id,old.settlement_id);
  received numeric;
  refunded numeric;
  paid_out numeric;
  settlement_due numeric;
  settlement_paid numeric;
  selling numeric;
  current_status text;
begin
  if target_settlement is not null then
    update public.journey_settlements settlement
    set
      amount_paid=coalesce((
        select sum(entry.amount)
        from public.accounting_transactions entry
        where entry.settlement_id=target_settlement
          and entry.transaction_type='supplier_payment'
      ),0),
      status=case
        when settlement.status='waived' then 'waived'
        when coalesce((
          select sum(entry.amount)
          from public.accounting_transactions entry
          where entry.settlement_id=target_settlement
            and entry.transaction_type='supplier_payment'
        ),0)>=settlement.amount_due then 'paid'
        when coalesce((
          select sum(entry.amount)
          from public.accounting_transactions entry
          where entry.settlement_id=target_settlement
            and entry.transaction_type='supplier_payment'
        ),0)>0 then 'part_paid'
        else 'pending'
      end
    where settlement.id=target_settlement;
  end if;

  select
    coalesce(sum(amount) filter (where transaction_type='customer_receipt'),0),
    coalesce(sum(amount) filter (where transaction_type='customer_refund'),0),
    coalesce(sum(amount) filter (where transaction_type='supplier_payment'),0)
  into received,refunded,paid_out
  from public.accounting_transactions
  where account_id=target_account;

  select
    coalesce(sum(amount_due) filter (where status<>'waived'),0),
    coalesce(sum(amount_paid) filter (where status<>'waived'),0)
  into settlement_due,settlement_paid
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
    status=case
      when current_status='void' then 'void'
      when received-refunded>=selling and settlement_paid>=settlement_due then 'settled'
      when received-refunded>=selling then 'paid'
      when received-refunded>0 then 'part_paid'
      else 'open'
    end,
    settled_at=case
      when received-refunded>=selling and settlement_paid>=settlement_due then coalesce(settled_at,now())
      else null
    end
  where id=target_account;
  return null;
end;
$$;

create trigger accounting_transactions_refresh
after insert or update or delete on public.accounting_transactions
for each row execute function private.refresh_journey_account();

create or replace function private.refresh_account_after_settlement()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  target_account uuid := coalesce(new.account_id,old.account_id);
begin
  update public.journey_accounts account
  set status=case
    when account.status='void' then 'void'
    when account.amount_received>=account.selling_price
      and not exists (
        select 1 from public.journey_settlements settlement
        where settlement.account_id=target_account
          and settlement.status not in ('paid','waived')
      ) then 'settled'
    when account.amount_received>=account.selling_price then 'paid'
    when account.amount_received>0 then 'part_paid'
    else 'open'
  end,
  settled_at=case
    when account.amount_received>=account.selling_price
      and not exists (
        select 1 from public.journey_settlements settlement
        where settlement.account_id=target_account
          and settlement.status not in ('paid','waived')
      ) then coalesce(account.settled_at,now())
    else null
  end
  where account.id=target_account;
  return null;
end;
$$;

create trigger journey_settlements_refresh_account
after insert or update or delete on public.journey_settlements
for each row execute function private.refresh_account_after_settlement();

alter table public.journey_accounts enable row level security;
alter table public.journey_settlements enable row level security;
alter table public.accounting_transactions enable row level security;

create policy journey_accounts_staff_read on public.journey_accounts
for select to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]));

create policy journey_settlements_staff_read on public.journey_settlements
for select to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]));

create policy accounting_transactions_staff_read on public.accounting_transactions
for select to authenticated
using (private.has_role(array['admin','editor']::public.profile_role[]));

-- Financial writes are deliberately server-only. Staff clients can read through
-- RLS, while validated admin API routes use the service role for posting entries.
revoke insert,update,delete on public.journey_accounts from anon,authenticated;
revoke insert,update,delete on public.journey_settlements from anon,authenticated;
revoke insert,update,delete on public.accounting_transactions from anon,authenticated;

comment on table public.journey_accounts is
  'Immutable commercial snapshot for a closed Roam Ceylon journey, with live receipt and settlement totals.';
comment on table public.journey_settlements is
  'Supplier and operational liabilities generated from the confidential DMC cost breakdown.';
comment on table public.accounting_transactions is
  'Auditable customer receipts, refunds, and supplier payments for journey accounts.';

commit;
