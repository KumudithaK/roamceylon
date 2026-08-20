begin;

insert into public.permissions(code,description) values
  ('journey.lifecycle.manage','Perform authorised Journey Designer lifecycle transitions'),
  ('journey.lifecycle.override','Perform exceptional founder-approved lifecycle transitions')
on conflict(code) do update set description=excluded.description;

insert into public.staff_role_permissions(role_code,permission_code) values
  ('journey_designer','journey.lifecycle.manage'),
  ('super_admin','journey.lifecycle.manage'),
  ('super_admin','journey.lifecycle.override')
on conflict do nothing;

create table public.enquiry_lifecycle_history(
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete restrict,
  from_status text not null,
  to_status text not null,
  action text not null,
  reason text,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint enquiry_lifecycle_history_change check(from_status<>to_status)
);
create index enquiry_lifecycle_history_enquiry_idx on public.enquiry_lifecycle_history(enquiry_id,created_at desc);
alter table public.enquiry_lifecycle_history enable row level security;
create policy enquiry_lifecycle_history_staff_read on public.enquiry_lifecycle_history for select to authenticated using(private.has_permission('journey.requests.view'));
grant select on public.enquiry_lifecycle_history to authenticated;
revoke insert,update,delete on public.enquiry_lifecycle_history from anon,authenticated;

create or replace function private.staff_has_permission(target_user uuid,target_permission text)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.profile_staff_roles r join public.staff_role_permissions g on g.role_code=r.role_code where r.profile_id=target_user and g.permission_code=target_permission)
$$;

create or replace function private.guard_enquiry_status_transition()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status is distinct from old.status and coalesce(current_setting('roam.workflow_command',true),'')<>'enquiry' then
    raise exception using errcode='42501',message='Enquiry lifecycle status may only be changed through an authorised workflow command.';
  end if;
  return new;
end $$;
drop trigger if exists enquiries_guard_status_transition on public.enquiries;
create trigger enquiries_guard_status_transition before update of status on public.enquiries for each row execute function private.guard_enquiry_status_transition();

create or replace function public.execute_enquiry_transition(p_enquiry_id uuid,p_action text,p_actor_id uuid default null,p_reason text default null)
returns table(status text,previous_status text,changed boolean)
language plpgsql security definer set search_path='' as $$
declare current_status text; target_status text; actor_id uuid; required_permission text; allowed_sources text[];
begin
  if auth.role()='service_role' then actor_id:=p_actor_id; else actor_id:=auth.uid(); end if;
  target_status:=case p_action
    when 'start_review' then 'under_review' when 'prepare_proposal' then 'preparing_proposal' when 'request_changes' then 'preparing_proposal'
    when 'mark_proposal_sent' then 'proposal_sent' when 'accept_proposal' then 'proposal_accepted'
    when 'request_deposit' then 'deposit_requested' when 'record_deposit' then 'deposit_paid'
    when 'confirm_journey' then 'journey_confirmed' when 'prepare_operations' then 'ready_for_operations'
    when 'start_travel' then 'travelling' when 'complete_journey' then 'completed'
    when 'cancel_journey' then 'cancelled' when 'archive_journey' then 'archived' else null end;
  if target_status is null then raise exception 'Unknown journey lifecycle action.'; end if;
  required_permission:=case
    when p_action in ('prepare_operations','start_travel','complete_journey') then 'operations.manage'
    when p_action='record_deposit' then 'finance.payments.manage'
    when p_action in ('cancel_journey','archive_journey') then 'journey.lifecycle.override'
    when p_action in ('accept_proposal','request_changes') and auth.role()='service_role' and actor_id is null then null
    else 'journey.lifecycle.manage' end;
  if required_permission is not null and (actor_id is null or not private.staff_has_permission(actor_id,required_permission)) then raise exception using errcode='42501',message='The caller is not authorised for this journey lifecycle action.'; end if;
  allowed_sources:=case p_action
    when 'start_review' then array['new'] when 'prepare_proposal' then array['new','under_review'] when 'request_changes' then array['proposal_sent','awaiting_traveller_approval']
    when 'mark_proposal_sent' then array['preparing_proposal'] when 'accept_proposal' then array['proposal_sent','awaiting_traveller_approval']
    when 'request_deposit' then array['proposal_accepted'] when 'record_deposit' then array['proposal_accepted','deposit_requested']
    when 'confirm_journey' then array['deposit_paid'] when 'prepare_operations' then array['journey_confirmed']
    when 'start_travel' then array['ready_for_operations'] when 'complete_journey' then array['travelling']
    when 'cancel_journey' then array['new','under_review','preparing_proposal','proposal_sent','awaiting_traveller_approval','proposal_accepted','deposit_requested','deposit_paid','journey_confirmed','ready_for_operations','travelling']
    when 'archive_journey' then array['completed','cancelled'] end;
  select e.status into current_status from public.enquiries e where e.id=p_enquiry_id for update;
  if not found then raise exception 'Traveller enquiry not found.'; end if;
  if current_status=target_status then return query select current_status,current_status,false;return;end if;
  if not current_status=any(allowed_sources) then raise exception 'Invalid journey lifecycle transition from % using action %.',current_status,p_action;end if;
  perform set_config('roam.workflow_command','enquiry',true);
  update public.enquiries set status=target_status where id=p_enquiry_id;
  insert into public.enquiry_lifecycle_history(enquiry_id,from_status,to_status,action,reason,changed_by) values(p_enquiry_id,current_status,target_status,p_action,nullif(btrim(p_reason),''),actor_id);
  return query select target_status,current_status,true;
end $$;

revoke all on function public.execute_enquiry_transition(uuid,text,uuid,text) from public,anon;
grant execute on function public.execute_enquiry_transition(uuid,text,uuid,text) to authenticated,service_role;
revoke update on public.enquiries from authenticated;

create or replace function public.accept_journey_proposal_command(p_proposal_id uuid,p_name text,p_email text,p_metadata jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare proposal_row public.journey_proposals%rowtype;
begin
  if auth.role()<>'service_role' then raise exception using errcode='42501',message='This command is available only to the trusted proposal service.';end if;
  select * into proposal_row from public.journey_proposals where id=p_proposal_id for update;
  if proposal_row.id is null then raise exception 'Journey proposal not found.';end if;
  if proposal_row.requires_new_version or proposal_row.status not in('sent','viewed') then raise exception 'This proposal version cannot be accepted.';end if;
  insert into public.journey_proposal_acceptances(proposal_id,proposal_version,traveller_name,traveller_email,accepted_total,currency,terms_acknowledged,metadata,accepted_at)
  values(proposal_row.id,proposal_row.version,btrim(p_name),lower(btrim(p_email)),proposal_row.total_selling_price,proposal_row.currency,true,coalesce(p_metadata,'{}'::jsonb),now());
  update public.journey_proposals set status='approved',approved_at=now(),accepted_at=now(),accepted_name=btrim(p_name),accepted_email=lower(btrim(p_email)),acceptance_metadata=coalesce(p_metadata,'{}'::jsonb) where id=proposal_row.id;
  perform public.execute_enquiry_transition(proposal_row.enquiry_id,'accept_proposal',null,'Traveller accepted proposal '||proposal_row.proposal_reference||'.');
  return proposal_row.id;
end $$;
revoke all on function public.accept_journey_proposal_command(uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.accept_journey_proposal_command(uuid,text,text,jsonb) to service_role;

create or replace function public.transition_journey_proposal_command(p_proposal_id uuid,p_action text,p_actor_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare proposal_row public.journey_proposals%rowtype;
begin
  if auth.role()<>'service_role' or p_actor_id is null then raise exception using errcode='42501',message='This command is available only to an authenticated trusted proposal service.';end if;
  select * into proposal_row from public.journey_proposals where id=p_proposal_id for update;if proposal_row.id is null then raise exception 'Journey proposal not found.';end if;
  if p_action='internal_approve' then
    if not private.staff_has_permission(p_actor_id,'journey.proposal.create') or proposal_row.status<>'ready' then raise exception 'This proposal cannot be approved internally.';end if;
    update public.journey_proposals set status='internal_approved',internally_approved_at=now(),internally_approved_by=p_actor_id where id=proposal_row.id;
    perform public.execute_enquiry_transition(proposal_row.enquiry_id,'prepare_proposal',p_actor_id,'Proposal '||proposal_row.proposal_reference||' approved internally.');
  elsif p_action='sent' then
    if not private.staff_has_permission(p_actor_id,'journey.proposal.send') or proposal_row.status<>'internal_approved' then raise exception 'This proposal cannot be sent.';end if;
    update public.journey_proposals set status='sent',sent_at=now(),sent_snapshot=customer_snapshot,public_token=gen_random_uuid(),requires_new_version=false,out_of_date_at=null,access_revoked_at=null,access_revoked_by=null,access_revocation_reason=null where id=proposal_row.id;
    perform public.execute_enquiry_transition(proposal_row.enquiry_id,'mark_proposal_sent',p_actor_id,'Proposal '||proposal_row.proposal_reference||' sent.');
  else raise exception 'Unknown proposal lifecycle action.';end if;
  return proposal_row.id;
end $$;
revoke all on function public.transition_journey_proposal_command(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.transition_journey_proposal_command(uuid,text,uuid) to service_role;

create or replace function public.request_journey_proposal_changes_command(p_proposal_id uuid,p_category text,p_message text,p_name text,p_email text)
returns uuid language plpgsql security definer set search_path='' as $$
declare proposal_row public.journey_proposals%rowtype;change_id uuid;
begin
  if auth.role()<>'service_role' then raise exception using errcode='42501',message='This command is available only to the trusted proposal service.';end if;
  select * into proposal_row from public.journey_proposals where id=p_proposal_id for update;if proposal_row.id is null or proposal_row.requires_new_version or proposal_row.status not in('sent','viewed') then raise exception 'This proposal version is not open for changes.';end if;
  insert into public.journey_proposal_change_requests(proposal_id,category,message,traveller_name,traveller_email) values(proposal_row.id,p_category,btrim(p_message),btrim(p_name),lower(btrim(p_email))) returning id into change_id;
  update public.journey_proposals set status='changes_requested',changes_requested_at=now() where id=proposal_row.id;
  perform public.execute_enquiry_transition(proposal_row.enquiry_id,'request_changes',null,'Traveller requested changes to proposal '||proposal_row.proposal_reference||'.');
  return change_id;
end $$;
revoke all on function public.request_journey_proposal_changes_command(uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.request_journey_proposal_changes_command(uuid,text,text,text,text) to service_role;

create or replace function private.guard_curated_journey_status_transition()
returns trigger language plpgsql security definer set search_path='' as $$ begin
  if new.status is distinct from old.status and coalesce(current_setting('roam.workflow_command',true),'')<>'curated' then raise exception using errcode='42501',message='Curated Journey status may only be changed through an authorised workflow command.';end if;return new;
end $$;
drop trigger if exists curated_journeys_guard_status_transition on public.curated_journeys;
create trigger curated_journeys_guard_status_transition before update of status on public.curated_journeys for each row execute function private.guard_curated_journey_status_transition();

create or replace function public.execute_curated_journey_transition(p_curated_journey_id uuid,p_action text,p_actor_id uuid default null)
returns text language plpgsql security definer set search_path='' as $$
declare current_status text;target_status text;actor_id uuid;required_permission text;
begin
  actor_id:=case when auth.role()='service_role' then p_actor_id else auth.uid() end;
  target_status:=case p_action when 'start_designing' then 'designing' when 'ready_for_allocation' then 'ready_for_allocation' when 'begin_allocation' then 'allocation_in_progress' when 'ready_for_proposal' then 'ready_for_proposal' end;
  if target_status is null then raise exception 'Unknown Curated Journey lifecycle action.';end if;
  required_permission:=case when p_action='begin_allocation' then 'suppliers.allocate' else 'journey.design.edit' end;
  if actor_id is null or not private.staff_has_permission(actor_id,required_permission) then raise exception using errcode='42501',message='The caller is not authorised for this Curated Journey action.';end if;
  select status into current_status from public.curated_journeys where id=p_curated_journey_id for update;if not found then raise exception 'Curated Journey not found.';end if;
  if current_status=target_status then return current_status;end if;
  if not ((p_action='start_designing' and current_status='not_started') or (p_action='ready_for_allocation' and current_status='designing') or (p_action='begin_allocation' and current_status in('ready_for_allocation','allocation_in_progress')) or (p_action='ready_for_proposal' and current_status in('ready_for_allocation','allocation_in_progress'))) then raise exception 'Invalid Curated Journey transition from % using action %.',current_status,p_action;end if;
  perform set_config('roam.workflow_command','curated',true);update public.curated_journeys set status=target_status,updated_by=actor_id where id=p_curated_journey_id;return target_status;
end $$;
revoke all on function public.execute_curated_journey_transition(uuid,text,uuid) from public,anon;
grant execute on function public.execute_curated_journey_transition(uuid,text,uuid) to authenticated,service_role;

comment on function public.execute_enquiry_transition(uuid,text,uuid,text) is 'Server-authoritative, row-locked enquiry lifecycle command. Target status is derived from a fixed business action.';
comment on table public.enquiry_lifecycle_history is 'Append-only audit record for accepted enquiry lifecycle transitions.';

commit;
