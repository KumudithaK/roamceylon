begin;

alter table public.enquiries
  add column public_submission_key uuid,
  add column public_submission_hash text,
  add constraint enquiries_public_submission_key_unique unique(public_submission_key),
  add constraint enquiries_public_submission_hash_format check(public_submission_hash is null or public_submission_hash~'^[0-9a-f]{64}$'),
  add constraint enquiries_public_submission_pair check((public_submission_key is null)=(public_submission_hash is null));

alter table public.partner_applications
  add column public_submission_key uuid,
  add column public_submission_hash text,
  add constraint partner_applications_public_submission_key_unique unique(public_submission_key),
  add constraint partner_applications_public_submission_hash_format check(public_submission_hash is null or public_submission_hash~'^[0-9a-f]{64}$'),
  add constraint partner_applications_public_submission_pair check((public_submission_key is null)=(public_submission_hash is null));

drop policy if exists enquiries_public_insert on public.enquiries;
revoke insert on public.enquiries from anon,authenticated;

comment on column public.enquiries.public_submission_key is 'Opaque idempotency key accepted only by the trusted public enquiry API.';
comment on column public.enquiries.public_submission_hash is 'Server-calculated digest distinguishing a safe replay from payload substitution.';
comment on column public.partner_applications.public_submission_key is 'Opaque idempotency key accepted only by the trusted partner application API.';
comment on column public.partner_applications.public_submission_hash is 'Server-calculated digest distinguishing a safe replay from payload substitution.';

commit;
