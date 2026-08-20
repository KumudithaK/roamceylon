begin;

-- Purpose-specific traveller-data capabilities. These are deliberately
-- separate from journey row access: a journey capability is not a PII grant.
insert into public.permissions(code,description) values
  ('traveller.pii.full.view','View the complete administrative traveller record.'),
  ('traveller.pii.design.view','View identity, contact and journey requirements needed to design a journey.'),
  ('traveller.pii.operations.view','View minimized traveller details needed to deliver an accepted or active journey.'),
  ('traveller.pii.finance.view','View the minimum traveller reference needed for accounting and payment reconciliation.'),
  ('traveller.context.suppliers.view','View non-identifying journey context needed for supplier allocation.')
on conflict(code) do update set description=excluded.description;

insert into public.staff_role_permissions(role_code,permission_code) values
  ('journey_designer','traveller.pii.design.view'),
  ('operations','traveller.pii.operations.view'),
  ('finance','traveller.pii.finance.view'),
  ('partner_manager','traveller.context.suppliers.view')
on conflict do nothing;

insert into public.staff_role_permissions(role_code,permission_code)
select 'super_admin',code from public.permissions
where code like 'traveller.%'
on conflict do nothing;

-- Complete base-row reads are removed for authenticated staff. Public inserts
-- and service-role orchestration remain unchanged. Limited SELECT columns are
-- retained only so existing capability-authorized status/note UPDATE commands
-- can continue without granting any traveller contact or brief fields.
drop policy if exists enquiries_staff_read on public.enquiries;
create policy enquiries_admin_base_read on public.enquiries for select to authenticated
using (private.has_permission('traveller.pii.full.view')
    or private.has_permission('journey.design.edit')
    or private.has_permission('operations.manage')
    or private.has_permission('finance.payments.manage'));

revoke select on public.enquiries from authenticated;
grant select(id,status,internal_notes,updated_at) on public.enquiries to authenticated;

-- Views intentionally execute as their owner so they can read the protected
-- base table, but every row is guarded by an exact caller capability. Security
-- barrier prevents caller predicates from being pushed below the guard.
create or replace view public.traveller_journey_design
with (security_barrier=true) as
select
  e.id,e.journey_reference,e.created_at,e.updated_at,e.name,e.email,e.phone,
  e.nationality,e.summary,e.trip_state,e.status,e.travel_start_date,e.travel_end_date,
  e.adults,e.children,e.selected_themes,e.selected_destinations,e.selected_experiences,
  e.experience_participants,e.selected_stays,e.selected_vehicle,e.selected_guide,
  e.traveller_notes,e.internal_notes,e.estimated_price_min,e.estimated_price_max,
  e.estimated_price_currency,e.estimated_price_basis,e.estimated_at,e.estimate_snapshot
from public.enquiries e
where private.has_permission('traveller.pii.design.view')
   or private.has_permission('traveller.pii.full.view');

create or replace view public.traveller_operations_context
with (security_barrier=true) as
select
  e.id,e.journey_reference,e.created_at,e.updated_at,e.name,e.phone,e.nationality,
  e.status,e.travel_start_date,e.travel_end_date,e.adults,e.children,
  e.selected_destinations,e.selected_experiences,e.experience_participants,
  e.selected_stays,e.selected_vehicle,e.selected_guide,e.traveller_notes,
  (e.trip_state - 'quote') as operational_brief
from public.enquiries e
where (private.has_permission('traveller.pii.operations.view')
       or private.has_permission('traveller.pii.full.view'))
  and e.status in (
    'proposal_accepted','deposit_requested','deposit_paid','journey_confirmed',
    'ready_for_operations','travelling','completed','cancelled'
  );

create or replace view public.traveller_finance_reference
with (security_barrier=true) as
select
  e.id,e.journey_reference,e.created_at,e.updated_at,e.name,e.status,
  e.travel_start_date,e.travel_end_date,e.adults,e.children
from public.enquiries e
where private.has_permission('traveller.pii.finance.view')
   or private.has_permission('traveller.pii.full.view');

create or replace view public.traveller_supplier_context
with (security_barrier=true) as
select
  e.id,e.journey_reference,e.created_at,e.updated_at,e.status,
  e.travel_start_date,e.travel_end_date,e.adults,e.children,
  e.selected_destinations,e.selected_experiences,e.experience_participants,
  jsonb_build_object(
    'version',1,
    'createdAt',coalesce(e.trip_state->'createdAt','""'::jsonb),
    'quote','null'::jsonb,
    'state',jsonb_build_object(
      'currentStep',coalesce(e.trip_state#>'{state,currentStep}','0'::jsonb),
      'selectedThemeIds',e.selected_themes,
      'selectedDestinationIds',e.selected_destinations,
      'selectedExperienceIds',e.selected_experiences,
      'experienceParticipants',e.experience_participants,
      'selectedStayIdsByDestination',coalesce(e.trip_state#>'{state,selectedStayIdsByDestination}','{}'::jsonb),
      'selectedVehicleId','null'::jsonb,
      'selectedGuideId','null'::jsonb,
      'selectedPricingPlanIds','{}'::jsonb,
      'destinationPreferences',coalesce((
        select jsonb_object_agg(preference.key,(preference.value - 'notes'))
        from jsonb_each(coalesce(e.trip_state#>'{state,destinationPreferences}','{}'::jsonb)) preference
      ),'{}'::jsonb),
      'journeyGuidePreference',coalesce(e.trip_state#>'{state,journeyGuidePreference}','"recommend"'::jsonb),
      'journeyGuideLanguages',coalesce(e.trip_state#>'{state,journeyGuideLanguages}','[]'::jsonb),
      'journeyGuideNotes','""'::jsonb,
      'globalTravelPreference',coalesce(e.trip_state#>'{state,globalTravelPreference}','"recommend"'::jsonb),
      'travelPreferencesByLeg',coalesce(e.trip_state#>'{state,travelPreferencesByLeg}','{}'::jsonb),
      'travellerCounts',coalesce(e.trip_state#>'{state,travellerCounts}',jsonb_build_object('adults',e.adults,'children',e.children,'infants',0)),
      'travelDates',coalesce(e.trip_state#>'{state,travelDates}',jsonb_build_object('start',e.travel_start_date,'end',e.travel_end_date)),
      'pickup',coalesce(e.trip_state#>'{state,pickup}','{}'::jsonb),
      'dropoff',coalesce(e.trip_state#>'{state,dropoff}','{}'::jsonb),
      'budgetPreference','"flexible"'::jsonb,
      'travelPace',coalesce(e.trip_state#>'{state,travelPace}','"balanced"'::jsonb),
      'accessibilityRequirements','""'::jsonb
    )
  ) as supplier_brief
from public.enquiries e
where private.has_permission('traveller.context.suppliers.view')
   or private.has_permission('traveller.pii.full.view');

create or replace view public.traveller_admin_full
with (security_barrier=true) as
select e.*
from public.enquiries e
where private.has_permission('traveller.pii.full.view');

-- A non-contact dashboard projection supports workload counts without leaking
-- email, phone, notes, trip JSON or estimate snapshots to staff roles.
create or replace view public.staff_journey_request_summary
with (security_barrier=true) as
select
  e.id,e.journey_reference,e.created_at,e.updated_at,e.status,
  case
    when private.has_permission('traveller.pii.design.view')
      or private.has_permission('traveller.pii.finance.view')
      or private.has_permission('traveller.pii.full.view') then e.name
    when private.has_permission('traveller.pii.operations.view') and e.status in (
      'proposal_accepted','deposit_requested','deposit_paid','journey_confirmed',
      'ready_for_operations','travelling','completed','cancelled'
    ) then e.name
    else null
  end as traveller_name,
  e.travel_start_date,e.travel_end_date,e.adults,e.children,
  jsonb_array_length(e.selected_destinations) as destination_count,
  e.estimated_price_min,e.estimated_price_max,e.estimated_price_currency,e.estimated_price_basis
from public.enquiries e
where private.has_permission('journey.requests.view')
   or private.has_permission('traveller.pii.full.view');

revoke all on public.traveller_journey_design,public.traveller_operations_context,
  public.traveller_finance_reference,public.traveller_supplier_context,
  public.traveller_admin_full,public.staff_journey_request_summary from public,anon;
grant select on public.traveller_journey_design,public.traveller_operations_context,
  public.traveller_finance_reference,public.traveller_supplier_context,
  public.traveller_admin_full,public.staff_journey_request_summary to authenticated,service_role;

-- Proposal copies contain traveller identity/contact data inside snapshots and
-- acceptance/change records. Direct authenticated base reads are removed;
-- trusted APIs must return purpose-shaped DTOs.
drop policy if exists proposals_staff_read on public.journey_proposals;
drop policy if exists proposal_acceptances_staff_read on public.journey_proposal_acceptances;
drop policy if exists proposal_changes_staff_read on public.journey_proposal_change_requests;
create policy proposals_admin_base_read on public.journey_proposals for select to authenticated
using (private.has_permission('traveller.pii.full.view'));
create policy proposal_acceptances_admin_base_read on public.journey_proposal_acceptances for select to authenticated
using (private.has_permission('traveller.pii.full.view'));
create policy proposal_changes_admin_base_read on public.journey_proposal_change_requests for select to authenticated
using (private.has_permission('traveller.pii.full.view'));
revoke select on public.journey_proposals,public.journey_proposal_acceptances,
  public.journey_proposal_change_requests from authenticated;

-- Finance receives complete commercial account fields without copied email or
-- the proposal/allocation JSON snapshot. Base-row reads remain unavailable.
drop policy if exists journey_accounts_staff_read on public.journey_accounts;
create policy journey_accounts_update_visibility on public.journey_accounts for select to authenticated
using (private.has_permission('finance.payments.manage')
    or private.has_permission('finance.accounts.override')
    or private.has_permission('traveller.pii.full.view'));
revoke select on public.journey_accounts from authenticated;
grant select(
  id,account_number,enquiry_id,journey_reference,traveller_name,status,active,
  activated_at,deactivated_at,review_reason,currency,selling_price,internal_cost,
  gross_profit,profit_margin,amount_received,amount_refunded,supplier_paid,
  supplier_savings,closure_adjustment,closure_reason,manually_closed_at,
  manually_closed_by,travel_start_date,travel_end_date,posted_at,settled_at,
  created_at,updated_at,created_by
) on public.journey_accounts to authenticated;

create or replace view public.finance_journey_accounts
with (security_barrier=true) as
select
  a.id,a.account_number,a.enquiry_id,a.journey_reference,a.traveller_name,
  a.status,a.active,a.activated_at,a.deactivated_at,a.review_reason,a.currency,
  a.selling_price,a.internal_cost,a.gross_profit,a.profit_margin,a.amount_received,
  a.amount_refunded,a.supplier_paid,a.supplier_savings,a.closure_adjustment,
  a.closure_reason,a.manually_closed_at,a.manually_closed_by,a.travel_start_date,
  a.travel_end_date,a.posted_at,a.settled_at,a.created_at,a.updated_at,a.created_by
from public.journey_accounts a
where private.has_permission('traveller.pii.finance.view')
   or private.has_permission('traveller.pii.full.view');

create or replace view public.journey_account_statuses
with (security_barrier=true) as
select a.id,a.enquiry_id,a.account_number,a.journey_reference,a.status,a.active,
  a.review_reason,a.currency,a.amount_received,a.amount_refunded,a.posted_at,a.settled_at
from public.journey_accounts a
where private.has_permission('journey.design.view')
   or private.has_permission('suppliers.allocate')
   or private.has_permission('operations.view')
   or private.has_permission('finance.revenue.view')
   or private.has_permission('traveller.pii.full.view');

revoke all on public.finance_journey_accounts,public.journey_account_statuses from public,anon;
grant select on public.finance_journey_accounts,public.journey_account_statuses to authenticated,service_role;

comment on view public.traveller_journey_design is 'Purpose-limited identity, contact and travel brief for Journey Design.';
comment on view public.traveller_operations_context is 'Purpose-limited operational traveller context, available only once an existing journey status is operationally relevant.';
comment on view public.traveller_finance_reference is 'Minimum identity/reference projection for Finance; excludes contact details, preferences and notes.';
comment on view public.traveller_supplier_context is 'Non-identifying party and route context for supplier allocation.';
comment on view public.finance_journey_accounts is 'Finance account projection excluding traveller email and copied quote/proposal JSON.';

notify pgrst,'reload schema';
commit;
