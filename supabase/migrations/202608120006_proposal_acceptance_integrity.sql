begin;

create or replace function private.guard_proposal_acceptance_immutable()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  raise exception using
    errcode='55000',
    message='A proposal acceptance is immutable.';
end;
$$;

drop trigger if exists journey_proposal_acceptances_immutable on public.journey_proposal_acceptances;
create trigger journey_proposal_acceptances_immutable
before update on public.journey_proposal_acceptances
for each row execute function private.guard_proposal_acceptance_immutable();

create or replace function private.guard_accepted_proposal_agreement()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if old.status='approved' and (
    new.public_token is distinct from old.public_token
    or new.approved_at is distinct from old.approved_at
    or new.accepted_at is distinct from old.accepted_at
    or new.accepted_name is distinct from old.accepted_name
    or new.accepted_email is distinct from old.accepted_email
    or new.acceptance_metadata is distinct from old.acceptance_metadata
  ) then
    raise exception using
      errcode='55000',
      message='The accepted proposal agreement is immutable.';
  end if;
  return new;
end;
$$;

drop trigger if exists journey_proposals_guard_accepted_agreement on public.journey_proposals;
create trigger journey_proposals_guard_accepted_agreement
before update on public.journey_proposals
for each row execute function private.guard_accepted_proposal_agreement();

drop function if exists public.accept_journey_proposal_command(uuid,text,text,jsonb);

create function public.accept_journey_proposal_command(
  p_public_token uuid,
  p_name text,
  p_email text,
  p_metadata jsonb
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  proposal_row public.journey_proposals%rowtype;
  expected_email text;
  snapshot_total numeric;
  snapshot_currency text;
begin
  if auth.role()<>'service_role' then
    raise exception using errcode='42501',message='This command is available only to the trusted proposal service.';
  end if;
  if p_public_token is null then
    raise exception using errcode='22023',message='The proposal token is invalid.';
  end if;
  if char_length(btrim(coalesce(p_name,''))) not between 2 and 150 then
    raise exception using errcode='22023',message='The traveller name is invalid.';
  end if;
  if char_length(btrim(coalesce(p_email,''))) not between 3 and 320 then
    raise exception using errcode='22023',message='The traveller email is invalid.';
  end if;
  if p_metadata is null or jsonb_typeof(p_metadata)<>'object' or pg_column_size(p_metadata)>4096 then
    raise exception using errcode='22023',message='The acceptance metadata is invalid.';
  end if;

  select * into proposal_row
  from public.journey_proposals
  where public_token=p_public_token
  for update;

  if proposal_row.id is null then
    raise exception using errcode='P0002',message='This proposal is unavailable.';
  end if;

  -- Serialize every acceptance for the enquiry, including competing proposal versions.
  perform pg_advisory_xact_lock(hashtextextended(proposal_row.enquiry_id::text,0));
  select * into proposal_row
  from public.journey_proposals
  where id=proposal_row.id
  for update;

  if proposal_row.access_revoked_at is not null then
    raise exception using errcode='55000',message='This proposal link has been revoked.';
  end if;
  if proposal_row.valid_until is not null and proposal_row.valid_until<current_date then
    raise exception using errcode='55000',message='This proposal has expired.';
  end if;
  if proposal_row.requires_new_version or proposal_row.out_of_date_at is not null then
    raise exception using errcode='55000',message='This proposal version is out of date.';
  end if;
  if proposal_row.status not in('sent','viewed')
     or proposal_row.internally_approved_at is null
     or proposal_row.sent_at is null
     or proposal_row.sent_snapshot is null then
    raise exception using errcode='55000',message='This proposal version is not open for acceptance.';
  end if;
  if proposal_row.version<>(select max(candidate.version) from public.journey_proposals candidate where candidate.enquiry_id=proposal_row.enquiry_id) then
    raise exception using errcode='55000',message='A newer proposal version is available.';
  end if;
  if exists(
    select 1
    from public.journey_proposal_acceptances acceptance
    join public.journey_proposals accepted_proposal on accepted_proposal.id=acceptance.proposal_id
    where accepted_proposal.enquiry_id=proposal_row.enquiry_id
  ) then
    raise exception using errcode='23505',message='A proposal for this journey has already been accepted.';
  end if;
  if proposal_row.curated_journey_id is not null and not exists(
    select 1 from public.curated_journeys journey
    where journey.id=proposal_row.curated_journey_id and journey.enquiry_id=proposal_row.enquiry_id
  ) then
    raise exception using errcode='23503',message='The proposal journey linkage is invalid.';
  end if;

  expected_email:=lower(btrim(proposal_row.sent_snapshot#>>'{traveller,email}'));
  if expected_email is null or expected_email='' or lower(btrim(p_email))<>expected_email then
    raise exception using errcode='22023',message='Use the email address associated with this journey proposal.';
  end if;
  if jsonb_typeof(proposal_row.sent_snapshot#>'{pricing,total}') is distinct from 'number' then
    raise exception using errcode='55000',message='The sent proposal has no authoritative customer total.';
  end if;
  snapshot_total:=(proposal_row.sent_snapshot#>>'{pricing,total}')::numeric;
  snapshot_currency:=upper(btrim(proposal_row.sent_snapshot#>>'{pricing,currency}'));
  if snapshot_total is distinct from proposal_row.total_selling_price or snapshot_currency is distinct from upper(proposal_row.currency) then
    raise exception using errcode='55000',message='The sent proposal commercial snapshot is inconsistent.';
  end if;
  if jsonb_typeof(proposal_row.allocation_snapshot) is distinct from 'array'
     or jsonb_typeof(proposal_row.commercial_snapshot) is distinct from 'object'
     or proposal_row.commercial_snapshot='{}'::jsonb then
    raise exception using errcode='55000',message='The proposal commercial agreement is incomplete.';
  end if;

  insert into public.journey_proposal_acceptances(
    proposal_id,proposal_version,traveller_name,traveller_email,
    accepted_total,currency,terms_acknowledged,metadata,accepted_at
  ) values(
    proposal_row.id,proposal_row.version,btrim(p_name),expected_email,
    proposal_row.total_selling_price,proposal_row.currency,true,p_metadata,now()
  );

  update public.journey_proposals set
    status='approved',approved_at=now(),accepted_at=now(),
    accepted_name=btrim(p_name),accepted_email=expected_email,
    acceptance_metadata=p_metadata
  where id=proposal_row.id and status in('sent','viewed');
  if not found then
    raise exception using errcode='40001',message='The proposal changed while it was being accepted.';
  end if;

  perform public.execute_enquiry_transition(
    proposal_row.enquiry_id,'accept_proposal',null,
    'Traveller accepted proposal '||proposal_row.proposal_reference||'.'
  );

  return proposal_row.id;
end;
$$;

revoke all on function public.accept_journey_proposal_command(uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.accept_journey_proposal_command(uuid,text,text,jsonb) to service_role;

comment on function public.accept_journey_proposal_command(uuid,text,text,jsonb) is
'Atomic exact-token acceptance of the current sent proposal version. Commercial values and all business linkage are derived from its immutable stored snapshots.';
comment on trigger journey_proposal_acceptances_immutable on public.journey_proposal_acceptances is
'Prevents accepted traveller terms and commercial evidence from being rewritten.';

commit;
