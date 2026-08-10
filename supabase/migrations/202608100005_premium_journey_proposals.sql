begin;

alter table public.website_settings
  add column if not exists whatsapp_url text,
  add column if not exists facebook_url text,
  add column if not exists website_url text,
  add column if not exists business_email text,
  add column if not exists business_registration_number text,
  add column if not exists sltda_registration_number text;

update public.website_settings
set contact_phone='+94 78 799 7897',
    whatsapp_number='+94 78 799 7897',
    whatsapp_url='https://wa.me/message/G2QL7XFYJ5MAP1',
    facebook_url='https://www.facebook.com/profile.php?id=61592704994306',
    business_address=E'Mahasen Mw, Rayfield Estate,\nPallewela,\nKuliyapitiya,\nSri Lanka',
    website_url=nullif(website_url,''),
    business_email=nullif(business_email,''),
    business_registration_number=nullif(business_registration_number,''),
    sltda_registration_number=nullif(sltda_registration_number,'')
where id=true;

alter table public.journey_proposals
  drop constraint if exists journey_proposals_status_check;

alter table public.journey_proposals
  add constraint journey_proposals_status_check check (status in (
    'ready','internal_approved','sent','viewed','changes_requested','approved',
    'expired','superseded','cancelled'
  )),
  add column if not exists public_token uuid not null default gen_random_uuid(),
  add column if not exists customer_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(customer_snapshot)='object'),
  add column if not exists sent_snapshot jsonb check (sent_snapshot is null or jsonb_typeof(sent_snapshot)='object'),
  add column if not exists internally_approved_at timestamptz,
  add column if not exists internally_approved_by uuid references auth.users(id),
  add column if not exists viewed_at timestamptz,
  add column if not exists changes_requested_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists accepted_name text,
  add column if not exists accepted_email text,
  add column if not exists acceptance_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(acceptance_metadata)='object');

create unique index if not exists journey_proposals_public_token_unique
on public.journey_proposals(public_token);

create table public.journey_proposal_change_requests (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.journey_proposals(id) on delete restrict,
  category text not null check (category in ('general','destination','accommodation','experience','transport','guide','budget','other')),
  message text not null check (char_length(btrim(message)) between 10 and 5000),
  traveller_name text not null,
  traveller_email text not null,
  status text not null default 'new' check (status in ('new','reviewed','resolved')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

create index journey_proposal_change_requests_proposal_idx
on public.journey_proposal_change_requests(proposal_id,created_at desc);

create table public.journey_proposal_acceptances (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null unique references public.journey_proposals(id) on delete restrict,
  proposal_version integer not null,
  traveller_name text not null,
  traveller_email text not null,
  accepted_total numeric not null check (accepted_total >= 0),
  currency text not null check (char_length(currency)=3),
  terms_acknowledged boolean not null check (terms_acknowledged),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  accepted_at timestamptz not null default now()
);

alter table public.journey_proposal_change_requests enable row level security;
alter table public.journey_proposal_acceptances enable row level security;

create policy proposal_change_requests_staff_read
on public.journey_proposal_change_requests for select to authenticated
using (private.has_permission('journey.proposal.view'));

create policy proposal_acceptances_staff_read
on public.journey_proposal_acceptances for select to authenticated
using (private.has_permission('journey.proposal.view'));

revoke insert,update,delete on public.journey_proposal_change_requests from anon,authenticated;
revoke insert,update,delete on public.journey_proposal_acceptances from anon,authenticated;
grant select on public.journey_proposal_change_requests,public.journey_proposal_acceptances to authenticated;

comment on column public.journey_proposals.customer_snapshot is
'Customer-safe proposal document prepared from the Curated Journey and saved allocation snapshots.';
comment on column public.journey_proposals.sent_snapshot is
'Immutable customer-facing document exactly as delivered when this proposal version was sent.';
comment on column public.journey_proposals.public_token is
'Opaque version-specific capability token used for traveller proposal access.';

commit;
