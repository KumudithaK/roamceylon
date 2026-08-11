begin;

alter table public.journey_proposals
  add column if not exists first_viewed_at timestamptz,
  add column if not exists last_viewed_at timestamptz,
  add column if not exists view_count integer not null default 0 check (view_count >= 0),
  add column if not exists access_revoked_at timestamptz,
  add column if not exists access_revoked_by uuid references auth.users(id),
  add column if not exists access_revocation_reason text;

alter table public.journey_proposal_change_requests
  drop constraint if exists journey_proposal_change_requests_category_check;

alter table public.journey_proposal_change_requests
  add constraint journey_proposal_change_requests_category_check check (category in (
    'general','destination','accommodation','experience','transport','guide','dates','budget','other'
  ));

comment on column public.journey_proposals.first_viewed_at is
'First non-invasive traveller view recorded for this exact proposal version.';
comment on column public.journey_proposals.last_viewed_at is
'Most recent traveller view recorded for this exact proposal version.';
comment on column public.journey_proposals.view_count is
'Number of traveller-page loads recorded for this exact proposal version.';
comment on column public.journey_proposals.access_revoked_at is
'When the secure traveller capability link was revoked without deleting proposal history.';
comment on column public.journey_proposals.access_revocation_reason is
'Internal reason for revoking the secure traveller capability link.';

commit;
