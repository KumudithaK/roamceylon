begin;

-- Capability lookup is the sole protected-business authorization primitive.
-- Legacy admin remains an explicit compatibility bypass; editor has no effect.
create or replace function private.has_permission(required_permission text)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select (select auth.uid()) is not null and (
    exists (
      select 1 from public.profiles profile
      where profile.id=(select auth.uid()) and profile.role='admin'
    )
    or exists (
      select 1
      from public.profile_staff_roles assignment
      join public.staff_role_permissions role_permission on role_permission.role_code=assignment.role_code
      join public.permissions permission on permission.code=role_permission.permission_code
      where assignment.profile_id=(select auth.uid())
        and permission.code=required_permission
    )
  );
$$;
revoke all on function private.has_permission(text) from public,anon;
grant execute on function private.has_permission(text) to authenticated,service_role;

revoke all on function public.current_staff_permissions() from public,anon;
grant execute on function public.current_staff_permissions() to authenticated,service_role;

-- Remove every existing policy from application tables. Replacement policies
-- are created below in the same transaction, avoiding mixed legacy/capability
-- authorization. Phase 2 projection views and their grants are untouched.
do $reset_application_policies$
declare policy_record record;
begin
  for policy_record in
    select schemaname,tablename,policyname
    from pg_policies
    where schemaname='public' and tablename=any(array[
      'accommodations','accounting_attachments','accounting_lifecycle_history','accounting_transactions',
      'benefit_definitions','content_import_runs','curated_journey_changes','curated_journeys',
      'destinations','enquiries','experience_destinations','experience_themes','experiences',
      'guide_destinations','guide_experiences','guide_themes','guides','homepage_content',
      'journey_accounts','journey_benefits','journey_cancellation_cases','journey_estimate_bands',
      'journey_pricing_settings','journey_proposal_acceptances','journey_proposal_change_requests',
      'journey_proposals','journey_settlements','journey_supplier_allocations',
      'partner_application_files','partner_application_history','partner_applications','partner_commercial_settings',
      'permissions','pricing_plans','profile_staff_roles','profiles','staff_role_permissions','staff_roles',
      'supplier_recoverability_history','theme_destinations','themes','tour_pricing_config',
      'tour_supplier_costs','vehicle_destinations','vehicles','website_settings'
    ])
  loop
    execute format('drop policy %I on %I.%I',policy_record.policyname,policy_record.schemaname,policy_record.tablename);
  end loop;
end
$reset_application_policies$;

-- Reset direct table privileges. Service-role privileges are intentionally
-- untouched; authenticated commands remain subject to the policies below.
do $reset_application_grants$
declare table_name text;
begin
  foreach table_name in array array[
    'accommodations','accounting_attachments','accounting_lifecycle_history','accounting_transactions',
    'benefit_definitions','content_import_runs','curated_journey_changes','curated_journeys',
    'destinations','enquiries','experience_destinations','experience_themes','experiences',
    'guide_destinations','guide_experiences','guide_themes','guides','homepage_content',
    'journey_accounts','journey_benefits','journey_cancellation_cases','journey_estimate_bands',
    'journey_pricing_settings','journey_proposal_acceptances','journey_proposal_change_requests',
    'journey_proposals','journey_settlements','journey_supplier_allocations',
    'partner_application_files','partner_application_history','partner_applications','partner_commercial_settings',
    'permissions','pricing_plans','profile_staff_roles','profiles','staff_role_permissions','staff_roles',
    'supplier_recoverability_history','theme_destinations','themes','tour_pricing_config',
    'tour_supplier_costs','vehicle_destinations','vehicles','website_settings'
  ]
  loop
    execute format('revoke all on table public.%I from anon,authenticated',table_name);
  end loop;
end
$reset_application_grants$;

-- CMS: anonymous users see only published content. Staff content access is
-- capability-based and separated into read and edit commands.
create policy themes_public_read on public.themes for select to anon using (status='published' and active);
create policy themes_staff_read on public.themes for select to authenticated using ((status='published' and active) or private.has_permission('cms.view'));
create policy themes_staff_insert on public.themes for insert to authenticated with check (private.has_permission('cms.edit'));
create policy themes_staff_update on public.themes for update to authenticated using (private.has_permission('cms.edit')) with check (private.has_permission('cms.edit'));
create policy themes_staff_delete on public.themes for delete to authenticated using (private.has_permission('cms.edit'));

create policy destinations_public_read on public.destinations for select to anon using (status='published' and active);
create policy destinations_staff_read on public.destinations for select to authenticated using ((status='published' and active) or private.has_permission('cms.view'));
create policy destinations_staff_insert on public.destinations for insert to authenticated with check (private.has_permission('cms.edit'));
create policy destinations_staff_update on public.destinations for update to authenticated using (private.has_permission('cms.edit')) with check (private.has_permission('cms.edit'));
create policy destinations_staff_delete on public.destinations for delete to authenticated using (private.has_permission('cms.edit'));

create policy experiences_public_read on public.experiences for select to anon using (status='published' and active);
create policy experiences_staff_read on public.experiences for select to authenticated using ((status='published' and active) or private.has_permission('cms.view'));
create policy experiences_staff_insert on public.experiences for insert to authenticated with check (private.has_permission('cms.edit'));
create policy experiences_staff_update on public.experiences for update to authenticated using (private.has_permission('cms.edit')) with check (private.has_permission('cms.edit'));
create policy experiences_staff_delete on public.experiences for delete to authenticated using (private.has_permission('cms.edit'));

create policy homepage_public_read on public.homepage_content for select to anon using (status='published' and active);
create policy homepage_staff_read on public.homepage_content for select to authenticated using ((status='published' and active) or private.has_permission('cms.view'));
create policy homepage_staff_insert on public.homepage_content for insert to authenticated with check (private.has_permission('cms.edit'));
create policy homepage_staff_update on public.homepage_content for update to authenticated using (private.has_permission('cms.edit')) with check (private.has_permission('cms.edit'));
create policy homepage_staff_delete on public.homepage_content for delete to authenticated using (private.has_permission('cms.edit'));

create policy content_import_staff_read on public.content_import_runs for select to authenticated using (private.has_permission('cms.view'));
create policy content_import_staff_manage on public.content_import_runs for all to authenticated using (private.has_permission('cms.edit')) with check (private.has_permission('cms.edit'));

-- Published CMS relationships stay public; drafts require CMS access.
create policy theme_destinations_public_read on public.theme_destinations for select to anon using (
  exists(select 1 from public.themes t where t.id=theme_id and t.status='published' and t.active)
  and exists(select 1 from public.destinations d where d.id=destination_id and d.status='published' and d.active)
);
create policy theme_destinations_staff_read on public.theme_destinations for select to authenticated using (private.has_permission('cms.view') or (
  exists(select 1 from public.themes t where t.id=theme_id and t.status='published' and t.active)
  and exists(select 1 from public.destinations d where d.id=destination_id and d.status='published' and d.active)
));
create policy theme_destinations_staff_insert on public.theme_destinations for insert to authenticated with check (private.has_permission('cms.edit'));
create policy theme_destinations_staff_update on public.theme_destinations for update to authenticated using (private.has_permission('cms.edit')) with check (private.has_permission('cms.edit'));
create policy theme_destinations_staff_delete on public.theme_destinations for delete to authenticated using (private.has_permission('cms.edit'));

create policy experience_destinations_public_read on public.experience_destinations for select to anon using (
  exists(select 1 from public.experiences e where e.id=experience_id and e.status='published' and e.active)
  and exists(select 1 from public.destinations d where d.id=destination_id and d.status='published' and d.active)
);
create policy experience_destinations_staff_read on public.experience_destinations for select to authenticated using (private.has_permission('cms.view') or (
  exists(select 1 from public.experiences e where e.id=experience_id and e.status='published' and e.active)
  and exists(select 1 from public.destinations d where d.id=destination_id and d.status='published' and d.active)
));
create policy experience_destinations_staff_insert on public.experience_destinations for insert to authenticated with check (private.has_permission('cms.edit'));
create policy experience_destinations_staff_update on public.experience_destinations for update to authenticated using (private.has_permission('cms.edit')) with check (private.has_permission('cms.edit'));
create policy experience_destinations_staff_delete on public.experience_destinations for delete to authenticated using (private.has_permission('cms.edit'));

create policy experience_themes_public_read on public.experience_themes for select to anon using (
  exists(select 1 from public.experiences e where e.id=experience_id and e.status='published' and e.active)
  and exists(select 1 from public.themes t where t.id=theme_id and t.status='published' and t.active)
);
create policy experience_themes_staff_read on public.experience_themes for select to authenticated using (private.has_permission('cms.view') or (
  exists(select 1 from public.experiences e where e.id=experience_id and e.status='published' and e.active)
  and exists(select 1 from public.themes t where t.id=theme_id and t.status='published' and t.active)
));
create policy experience_themes_staff_insert on public.experience_themes for insert to authenticated with check (private.has_permission('cms.edit'));
create policy experience_themes_staff_update on public.experience_themes for update to authenticated using (private.has_permission('cms.edit')) with check (private.has_permission('cms.edit'));
create policy experience_themes_staff_delete on public.experience_themes for delete to authenticated using (private.has_permission('cms.edit'));

-- Supplier master data is never anonymously available from base tables.
create policy accommodations_staff_read on public.accommodations for select to authenticated using (private.has_permission('suppliers.view'));
create policy accommodations_staff_insert on public.accommodations for insert to authenticated with check (private.has_permission('suppliers.manage'));
create policy accommodations_staff_update on public.accommodations for update to authenticated using (private.has_permission('suppliers.manage')) with check (private.has_permission('suppliers.manage'));
create policy accommodations_staff_delete on public.accommodations for delete to authenticated using (private.has_permission('suppliers.manage'));

create policy vehicles_staff_read on public.vehicles for select to authenticated using (private.has_permission('suppliers.view'));
create policy vehicles_staff_insert on public.vehicles for insert to authenticated with check (private.has_permission('suppliers.manage'));
create policy vehicles_staff_update on public.vehicles for update to authenticated using (private.has_permission('suppliers.manage')) with check (private.has_permission('suppliers.manage'));
create policy vehicles_staff_delete on public.vehicles for delete to authenticated using (private.has_permission('suppliers.manage'));

create policy guides_staff_read on public.guides for select to authenticated using (private.has_permission('suppliers.view'));
create policy guides_staff_insert on public.guides for insert to authenticated with check (private.has_permission('suppliers.manage'));
create policy guides_staff_update on public.guides for update to authenticated using (private.has_permission('suppliers.manage')) with check (private.has_permission('suppliers.manage'));
create policy guides_staff_delete on public.guides for delete to authenticated using (private.has_permission('suppliers.manage'));

-- Supplier discovery links remain public only for published linked records.
create policy vehicle_destinations_public_read on public.vehicle_destinations for select to anon using (
  exists(select 1 from public.public_vehicles v where v.id=vehicle_id)
  and exists(select 1 from public.destinations d where d.id=destination_id and d.status='published' and d.active)
);
create policy vehicle_destinations_staff_read on public.vehicle_destinations for select to authenticated using (private.has_permission('suppliers.view') or (
  exists(select 1 from public.public_vehicles v where v.id=vehicle_id)
  and exists(select 1 from public.destinations d where d.id=destination_id and d.status='published' and d.active)
));
create policy vehicle_destinations_staff_manage on public.vehicle_destinations for all to authenticated using (private.has_permission('suppliers.manage')) with check (private.has_permission('suppliers.manage'));

create policy guide_destinations_public_read on public.guide_destinations for select to anon using (
  exists(select 1 from public.public_guides g where g.id=guide_id)
  and exists(select 1 from public.destinations d where d.id=destination_id and d.status='published' and d.active)
);
create policy guide_destinations_staff_read on public.guide_destinations for select to authenticated using (private.has_permission('suppliers.view') or (
  exists(select 1 from public.public_guides g where g.id=guide_id)
  and exists(select 1 from public.destinations d where d.id=destination_id and d.status='published' and d.active)
));
create policy guide_destinations_staff_manage on public.guide_destinations for all to authenticated using (private.has_permission('suppliers.manage')) with check (private.has_permission('suppliers.manage'));

create policy guide_themes_public_read on public.guide_themes for select to anon using (
  exists(select 1 from public.public_guides g where g.id=guide_id)
  and exists(select 1 from public.themes t where t.id=theme_id and t.status='published' and t.active)
);
create policy guide_themes_staff_read on public.guide_themes for select to authenticated using (private.has_permission('suppliers.view') or (
  exists(select 1 from public.public_guides g where g.id=guide_id)
  and exists(select 1 from public.themes t where t.id=theme_id and t.status='published' and t.active)
));
create policy guide_themes_staff_manage on public.guide_themes for all to authenticated using (private.has_permission('suppliers.manage')) with check (private.has_permission('suppliers.manage'));

create policy guide_experiences_public_read on public.guide_experiences for select to anon using (
  exists(select 1 from public.public_guides g where g.id=guide_id)
  and exists(select 1 from public.experiences e where e.id=experience_id and e.status='published' and e.active)
);
create policy guide_experiences_staff_read on public.guide_experiences for select to authenticated using (private.has_permission('suppliers.view') or (
  exists(select 1 from public.public_guides g where g.id=guide_id)
  and exists(select 1 from public.experiences e where e.id=experience_id and e.status='published' and e.active)
));
create policy guide_experiences_staff_manage on public.guide_experiences for all to authenticated using (private.has_permission('suppliers.manage')) with check (private.has_permission('suppliers.manage'));

-- Rates are supplier-managed, except experience ticket types which are CMS.
create policy pricing_plans_staff_read on public.pricing_plans for select to authenticated using (
  private.has_permission('suppliers.rates.view') or (entity_type='experience' and private.has_permission('cms.view'))
);
create policy pricing_plans_staff_insert on public.pricing_plans for insert to authenticated with check (
  private.has_permission('suppliers.manage') or (entity_type='experience' and private.has_permission('cms.edit'))
);
create policy pricing_plans_staff_update on public.pricing_plans for update to authenticated using (
  private.has_permission('suppliers.manage') or (entity_type='experience' and private.has_permission('cms.edit'))
) with check (private.has_permission('suppliers.manage') or (entity_type='experience' and private.has_permission('cms.edit')));
create policy pricing_plans_staff_delete on public.pricing_plans for delete to authenticated using (
  private.has_permission('suppliers.manage') or (entity_type='experience' and private.has_permission('cms.edit'))
);

create policy tour_supplier_costs_staff_read on public.tour_supplier_costs for select to authenticated using (private.has_permission('suppliers.rates.view') or private.has_permission('finance.costs.view'));
create policy tour_supplier_costs_staff_manage on public.tour_supplier_costs for all to authenticated using (private.has_permission('suppliers.manage')) with check (private.has_permission('suppliers.manage'));

-- Partner workflow data is private supplier-management data.
create policy partner_applications_staff_read on public.partner_applications for select to authenticated using (private.has_permission('suppliers.view'));
create policy partner_applications_staff_insert on public.partner_applications for insert to authenticated with check (private.has_permission('suppliers.manage'));
create policy partner_applications_staff_update on public.partner_applications for update to authenticated using (private.has_permission('suppliers.manage')) with check (private.has_permission('suppliers.manage'));
create policy partner_applications_staff_delete on public.partner_applications for delete to authenticated using (private.has_permission('suppliers.manage'));
create policy partner_files_staff_read on public.partner_application_files for select to authenticated using (private.has_permission('suppliers.view'));
create policy partner_files_staff_manage on public.partner_application_files for all to authenticated using (private.has_permission('suppliers.manage')) with check (private.has_permission('suppliers.manage'));
create policy partner_history_staff_read on public.partner_application_history for select to authenticated using (private.has_permission('suppliers.view'));
create policy partner_history_staff_insert on public.partner_application_history for insert to authenticated with check (private.has_permission('suppliers.manage'));
create policy partner_settings_staff_manage on public.partner_commercial_settings for all to authenticated using (private.has_permission('settings.manage')) with check (private.has_permission('settings.manage'));

-- Public traveller submissions are append-only; staff access uses journey capabilities.
create policy enquiries_public_insert on public.enquiries for insert to anon,authenticated with check (status='new' and internal_notes is null);
create policy enquiries_staff_read on public.enquiries for select to authenticated using (private.has_permission('journey.requests.view'));
create policy enquiries_staff_update on public.enquiries for update to authenticated using (
  private.has_permission('journey.design.edit') or private.has_permission('operations.manage') or private.has_permission('finance.payments.manage')
) with check (private.has_permission('journey.design.edit') or private.has_permission('operations.manage') or private.has_permission('finance.payments.manage'));
create policy enquiries_staff_delete on public.enquiries for delete to authenticated using (private.has_permission('users.manage'));

create policy curated_journeys_staff_read on public.curated_journeys for select to authenticated using (private.has_permission('journey.design.view'));
create policy curated_journeys_staff_insert on public.curated_journeys for insert to authenticated with check (private.has_permission('journey.design.edit'));
create policy curated_journeys_staff_update on public.curated_journeys for update to authenticated using (private.has_permission('journey.design.edit')) with check (private.has_permission('journey.design.edit'));
create policy curated_journeys_staff_delete on public.curated_journeys for delete to authenticated using (private.has_permission('journey.design.edit'));
create policy curated_changes_staff_read on public.curated_journey_changes for select to authenticated using (private.has_permission('journey.design.view'));
create policy curated_changes_staff_insert on public.curated_journey_changes for insert to authenticated with check (private.has_permission('journey.design.edit'));

create policy allocations_staff_read on public.journey_supplier_allocations for select to authenticated using (
  private.has_permission('suppliers.allocate') or private.has_permission('journey.proposal.view') or private.has_permission('operations.view') or private.has_permission('finance.costs.view') or private.has_permission('finance.revenue.view')
);
create policy allocations_staff_insert on public.journey_supplier_allocations for insert to authenticated with check (private.has_permission('suppliers.allocate'));
create policy allocations_staff_update on public.journey_supplier_allocations for update to authenticated using (private.has_permission('suppliers.allocate') or private.has_permission('operations.manage')) with check (private.has_permission('suppliers.allocate') or private.has_permission('operations.manage'));
create policy allocations_staff_delete on public.journey_supplier_allocations for delete to authenticated using (private.has_permission('suppliers.allocate'));

-- Operations may maintain delivery details, but cannot use its UPDATE grant to
-- re-parent an allocation, replace a supplier, or alter commercial terms.
create or replace function private.enforce_allocation_identity_capability()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if (select auth.role())='authenticated'
    and not private.has_permission('suppliers.allocate')
    and (
      new.enquiry_id is distinct from old.enquiry_id
      or new.curated_journey_id is distinct from old.curated_journey_id
      or new.allocation_type is distinct from old.allocation_type
      or new.destination_id is distinct from old.destination_id
      or new.from_destination_id is distinct from old.from_destination_id
      or new.to_destination_id is distinct from old.to_destination_id
      or new.from_location_key is distinct from old.from_location_key
      or new.to_location_key is distinct from old.to_location_key
      or new.accommodation_id is distinct from old.accommodation_id
      or new.guide_id is distinct from old.guide_id
      or new.vehicle_id is distinct from old.vehicle_id
      or new.experience_id is distinct from old.experience_id
      or new.pricing_plan_id is distinct from old.pricing_plan_id
      or new.pricing_plan_snapshot is distinct from old.pricing_plan_snapshot
      or new.service_name is distinct from old.service_name
      or new.quantity is distinct from old.quantity
      or new.quantity_label is distinct from old.quantity_label
      or new.service_details is distinct from old.service_details
      or new.provider_name is distinct from old.provider_name
      or new.supplier_contact is distinct from old.supplier_contact
      or new.supplier_cost is distinct from old.supplier_cost
      or new.selling_price is distinct from old.selling_price
      or new.currency is distinct from old.currency
    ) then
    raise exception 'Supplier allocation capability is required to change allocation identity or commercial terms.' using errcode='42501';
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_allocation_identity_capability() from public,anon,authenticated;

drop trigger if exists journey_allocations_require_allocation_capability on public.journey_supplier_allocations;
create trigger journey_allocations_require_allocation_capability
before update on public.journey_supplier_allocations
for each row execute function private.enforce_allocation_identity_capability();

-- Proposal commands remain separate capabilities. State-machine redesign is out of scope.
create policy proposals_staff_read on public.journey_proposals for select to authenticated using (private.has_permission('journey.proposal.view'));
create policy proposals_staff_insert on public.journey_proposals for insert to authenticated with check (private.has_permission('journey.proposal.create'));
create policy proposals_staff_update on public.journey_proposals for update to authenticated using (
  private.has_permission('journey.proposal.create') or private.has_permission('journey.proposal.send') or private.has_permission('journey.proposal.manage')
) with check (private.has_permission('journey.proposal.create') or private.has_permission('journey.proposal.send') or private.has_permission('journey.proposal.manage'));
create policy proposals_staff_delete on public.journey_proposals for delete to authenticated using (private.has_permission('journey.proposal.manage'));
create policy proposal_acceptances_staff_read on public.journey_proposal_acceptances for select to authenticated using (private.has_permission('journey.proposal.view'));
create policy proposal_changes_staff_read on public.journey_proposal_change_requests for select to authenticated using (private.has_permission('journey.proposal.view'));

-- Benefits preserve separate definition, assignment, fulfilment and reference access.
create policy benefit_definitions_staff_read on public.benefit_definitions for select to authenticated using (private.has_permission('benefits.view'));
create policy benefit_definitions_staff_manage on public.benefit_definitions for all to authenticated using (private.has_permission('benefits.manage')) with check (private.has_permission('benefits.manage'));
create policy journey_benefits_staff_read on public.journey_benefits for select to authenticated using (private.has_permission('benefits.view'));
create policy journey_benefits_staff_insert on public.journey_benefits for insert to authenticated with check (private.has_permission('benefits.assign'));
create policy journey_benefits_staff_update on public.journey_benefits for update to authenticated using (private.has_permission('benefits.assign') or private.has_permission('operations.manage')) with check (private.has_permission('benefits.assign') or private.has_permission('operations.manage'));
create policy journey_benefits_staff_delete on public.journey_benefits for delete to authenticated using (private.has_permission('benefits.manage'));

-- Business-wide pricing configuration is restricted to settings managers.
create policy journey_pricing_settings_staff on public.journey_pricing_settings for all to authenticated using (private.has_permission('settings.manage')) with check (private.has_permission('settings.manage'));
create policy journey_estimate_bands_staff on public.journey_estimate_bands for all to authenticated using (private.has_permission('settings.manage')) with check (private.has_permission('settings.manage'));
create policy tour_pricing_config_staff on public.tour_pricing_config for all to authenticated using (private.has_permission('settings.manage')) with check (private.has_permission('settings.manage'));
create policy website_settings_staff on public.website_settings for all to authenticated using (private.has_permission('settings.manage')) with check (private.has_permission('settings.manage'));

-- Finance data: read and ordinary payment commands are distinct from the two
-- high-risk correction capabilities established in Phase 3.
create policy journey_accounts_staff_read on public.journey_accounts for select to authenticated using (private.has_permission('finance.revenue.view') or private.has_permission('finance.costs.view') or private.has_permission('finance.payments.manage'));
create policy journey_accounts_staff_insert on public.journey_accounts for insert to authenticated with check (private.has_permission('finance.payments.manage'));
create policy journey_accounts_staff_update on public.journey_accounts for update to authenticated using (private.has_permission('finance.payments.manage') or private.has_permission('finance.accounts.override')) with check (private.has_permission('finance.payments.manage') or private.has_permission('finance.accounts.override'));
create policy journey_accounts_staff_delete on public.journey_accounts for delete to authenticated using (private.has_permission('finance.accounts.override'));

-- RLS controls the UPDATE command, while this column guard reserves the
-- exceptional force-close fields for the narrower override capability. Routine
-- account recalculation performed by trusted server/service-role paths is not
-- affected. This does not alter accounting calculations or lifecycle rules.
create or replace function private.enforce_journey_account_override_capability()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if (select auth.role())='authenticated'
    and (
      new.closure_adjustment is distinct from old.closure_adjustment
      or new.closure_reason is distinct from old.closure_reason
      or new.manually_closed_at is distinct from old.manually_closed_at
      or new.manually_closed_by is distinct from old.manually_closed_by
      or (pg_trigger_depth()=1 and new.status='closed' and new.status is distinct from old.status)
    )
    and not private.has_permission('finance.accounts.override') then
    raise exception 'Account override capability is required.' using errcode='42501';
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_journey_account_override_capability() from public,anon,authenticated;

drop trigger if exists journey_accounts_require_override_capability on public.journey_accounts;
create trigger journey_accounts_require_override_capability
before update of status,closure_adjustment,closure_reason,manually_closed_at,manually_closed_by
on public.journey_accounts
for each row execute function private.enforce_journey_account_override_capability();

create policy accounting_transactions_staff_read on public.accounting_transactions for select to authenticated using (private.has_permission('finance.revenue.view') or private.has_permission('finance.costs.view') or private.has_permission('finance.payments.manage'));
create policy accounting_transactions_staff_insert on public.accounting_transactions for insert to authenticated with check (private.has_permission('finance.payments.manage'));
create policy accounting_transactions_staff_delete on public.accounting_transactions for delete to authenticated using (private.has_permission('finance.settlements.reverse'));
create policy accounting_attachments_staff_read on public.accounting_attachments for select to authenticated using (private.has_permission('finance.payments.manage'));
create policy accounting_attachments_staff_insert on public.accounting_attachments for insert to authenticated with check (private.has_permission('finance.payments.manage'));
create policy accounting_attachments_staff_delete on public.accounting_attachments for delete to authenticated using (private.has_permission('finance.payments.manage'));
create policy accounting_lifecycle_staff_read on public.accounting_lifecycle_history for select to authenticated using (private.has_permission('finance.payments.manage'));
create policy accounting_lifecycle_staff_insert on public.accounting_lifecycle_history for insert to authenticated with check (private.has_permission('finance.payments.manage'));

create policy settlements_staff_read on public.journey_settlements for select to authenticated using (private.has_permission('finance.costs.view') or private.has_permission('finance.payments.manage'));
create policy settlements_staff_insert on public.journey_settlements for insert to authenticated with check (private.has_permission('finance.payments.manage'));
create policy settlements_staff_update on public.journey_settlements for update to authenticated using (private.has_permission('finance.payments.manage') or private.has_permission('finance.settlements.reverse')) with check (private.has_permission('finance.payments.manage') or private.has_permission('finance.settlements.reverse'));
create policy settlements_staff_delete on public.journey_settlements for delete to authenticated using (private.has_permission('finance.settlements.reverse'));
create policy cancellation_cases_staff_read on public.journey_cancellation_cases for select to authenticated using (private.has_permission('finance.payments.manage'));
create policy cancellation_cases_staff_manage on public.journey_cancellation_cases for all to authenticated using (private.has_permission('finance.payments.manage')) with check (private.has_permission('finance.payments.manage'));
create policy recoverability_history_staff_read on public.supplier_recoverability_history for select to authenticated using (private.has_permission('finance.payments.manage'));

-- Staff/access configuration cannot be self-assigned by ordinary roles.
create policy profiles_own_read on public.profiles for select to authenticated using (id=(select auth.uid()) or private.has_permission('users.manage'));
create policy profiles_admin_manage on public.profiles for all to authenticated using (private.has_permission('users.manage')) with check (private.has_permission('users.manage'));
create policy permissions_admin_read on public.permissions for select to authenticated using (private.has_permission('users.manage'));
create policy permissions_admin_manage on public.permissions for all to authenticated using (private.has_permission('users.manage')) with check (private.has_permission('users.manage'));
create policy staff_roles_admin_read on public.staff_roles for select to authenticated using (private.has_permission('users.manage'));
create policy staff_roles_admin_manage on public.staff_roles for all to authenticated using (private.has_permission('users.manage')) with check (private.has_permission('users.manage'));
create policy staff_role_permissions_admin_read on public.staff_role_permissions for select to authenticated using (private.has_permission('users.manage'));
create policy staff_role_permissions_admin_manage on public.staff_role_permissions for all to authenticated using (private.has_permission('users.manage')) with check (private.has_permission('users.manage'));
create policy profile_staff_roles_own_read on public.profile_staff_roles for select to authenticated using (profile_id=(select auth.uid()) or private.has_permission('users.manage'));
create policy profile_staff_roles_admin_manage on public.profile_staff_roles for all to authenticated using (private.has_permission('users.manage')) with check (private.has_permission('users.manage'));

-- Least-privilege command grants. RLS remains the row/role authorization gate.
grant select,insert,update,delete on public.themes,public.destinations,public.experiences,public.homepage_content,public.content_import_runs to authenticated;
grant select,insert,update,delete on public.theme_destinations,public.experience_destinations,public.experience_themes to authenticated;
grant select,insert,update,delete on public.accommodations,public.vehicles,public.guides to authenticated;
grant select,insert,update,delete on public.vehicle_destinations,public.guide_destinations,public.guide_themes,public.guide_experiences to authenticated;
grant select,insert,update,delete on public.pricing_plans,public.tour_supplier_costs to authenticated;
grant select,insert,update,delete on public.partner_applications,public.partner_application_files,public.partner_application_history,public.partner_commercial_settings to authenticated;
grant select,insert,update,delete on public.enquiries,public.curated_journeys,public.curated_journey_changes,public.journey_supplier_allocations to authenticated;
grant select,insert,update,delete on public.journey_proposals,public.journey_proposal_acceptances,public.journey_proposal_change_requests to authenticated;
grant select,insert,update,delete on public.benefit_definitions,public.journey_benefits to authenticated;
grant select,insert,update,delete on public.journey_pricing_settings,public.journey_estimate_bands,public.tour_pricing_config,public.website_settings to authenticated;
grant select,insert,update,delete on public.journey_accounts,public.accounting_transactions,public.accounting_attachments,public.accounting_lifecycle_history,public.journey_settlements,public.journey_cancellation_cases,public.supplier_recoverability_history to authenticated;
grant select,insert,update,delete on public.profiles,public.permissions,public.staff_roles,public.staff_role_permissions,public.profile_staff_roles to authenticated;

grant select on public.themes,public.destinations,public.experiences,public.homepage_content,public.theme_destinations,public.experience_destinations,public.experience_themes,public.vehicle_destinations,public.guide_destinations,public.guide_themes,public.guide_experiences to anon;
grant insert on public.enquiries to anon;
revoke all on sequence public.journey_account_number_seq from anon,authenticated;
grant usage,select on sequence public.journey_account_number_seq to authenticated;

-- Future application objects must opt in to SDK access instead of inheriting
-- broad dump-era grants. Existing objects were handled explicitly above.
alter default privileges for role postgres in schema public revoke all on tables from anon,authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon,authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon,authenticated;

-- Relationship RPC now checks the exact capability for the resource family.
create or replace function public.sync_content_relationships(
  resource_type text,
  resource_id uuid,
  theme_ids uuid[] default '{}'::uuid[],
  destination_ids uuid[] default '{}'::uuid[],
  experience_ids uuid[] default '{}'::uuid[]
)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if resource_type in ('destinations','experiences') and not private.has_permission('cms.edit') then
    raise exception 'CMS edit capability is required.' using errcode='42501';
  elsif resource_type in ('vehicles','guides') and not private.has_permission('suppliers.manage') then
    raise exception 'Supplier management capability is required.' using errcode='42501';
  elsif resource_type not in ('destinations','experiences','vehicles','guides') then
    raise exception 'Unsupported relationship resource type.' using errcode='22023';
  end if;

  case resource_type
    when 'destinations' then
      delete from public.theme_destinations where destination_id=resource_id;
      insert into public.theme_destinations(theme_id,destination_id)
      select distinct value,resource_id from unnest(coalesce(theme_ids,'{}'::uuid[])) value on conflict do nothing;
    when 'experiences' then
      delete from public.experience_themes where experience_id=resource_id;
      delete from public.experience_destinations where experience_id=resource_id;
      insert into public.experience_themes(experience_id,theme_id)
      select resource_id,value from (select distinct value from unnest(coalesce(theme_ids,'{}'::uuid[])) value) values_to_add on conflict do nothing;
      insert into public.experience_destinations(experience_id,destination_id)
      select resource_id,value from (select distinct value from unnest(coalesce(destination_ids,'{}'::uuid[])) value) values_to_add on conflict do nothing;
    when 'vehicles' then
      delete from public.vehicle_destinations where vehicle_id=resource_id;
      insert into public.vehicle_destinations(vehicle_id,destination_id)
      select resource_id,value from (select distinct value from unnest(coalesce(destination_ids,'{}'::uuid[])) value) values_to_add on conflict do nothing;
    when 'guides' then
      delete from public.guide_themes where guide_id=resource_id;
      delete from public.guide_destinations where guide_id=resource_id;
      delete from public.guide_experiences where guide_id=resource_id;
      insert into public.guide_themes(guide_id,theme_id)
      select resource_id,value from (select distinct value from unnest(coalesce(theme_ids,'{}'::uuid[])) value) values_to_add on conflict do nothing;
      insert into public.guide_destinations(guide_id,destination_id)
      select resource_id,value from (select distinct value from unnest(coalesce(destination_ids,'{}'::uuid[])) value) values_to_add on conflict do nothing;
      insert into public.guide_experiences(guide_id,experience_id)
      select resource_id,value from (select distinct value from unnest(coalesce(experience_ids,'{}'::uuid[])) value) values_to_add on conflict do nothing;
  end case;
end;
$$;
revoke all on function public.sync_content_relationships(text,uuid,uuid[],uuid[],uuid[]) from public,anon;
grant execute on function public.sync_content_relationships(text,uuid,uuid[],uuid[],uuid[]) to authenticated,service_role;

-- Storage policies are capability-based. Applicant uploads continue through the
-- server-side service role, so no anonymous object policy is required.
drop policy if exists travel_content_public_read on storage.objects;
drop policy if exists travel_content_staff_insert on storage.objects;
drop policy if exists travel_content_staff_update on storage.objects;
drop policy if exists travel_content_staff_delete on storage.objects;
drop policy if exists partner_media_staff_read on storage.objects;
drop policy if exists partner_documents_staff_read on storage.objects;
drop policy if exists partner_storage_admin_manage on storage.objects;
drop policy if exists accounting_receipts_staff_read on storage.objects;
drop policy if exists accounting_receipts_finance_read on storage.objects;

create policy travel_content_public_read on storage.objects for select to anon,authenticated
using (bucket_id='travel-content');
create policy travel_content_cms_insert on storage.objects for insert to authenticated
with check (bucket_id='travel-content' and private.has_permission('cms.edit') and name!~ '(^|/)\.\.(/|$)');
create policy travel_content_cms_update on storage.objects for update to authenticated
using (bucket_id='travel-content' and private.has_permission('cms.edit'))
with check (bucket_id='travel-content' and private.has_permission('cms.edit') and name!~ '(^|/)\.\.(/|$)');
create policy travel_content_cms_delete on storage.objects for delete to authenticated
using (bucket_id='travel-content' and private.has_permission('cms.edit'));

create policy partner_storage_staff_read on storage.objects for select to authenticated
using (bucket_id in ('partner-application-media','partner-application-documents') and private.has_permission('suppliers.view'));
create policy partner_storage_staff_insert on storage.objects for insert to authenticated
with check (bucket_id in ('partner-application-media','partner-application-documents') and private.has_permission('suppliers.manage') and name!~ '(^|/)\.\.(/|$)');
create policy partner_storage_staff_update on storage.objects for update to authenticated
using (bucket_id in ('partner-application-media','partner-application-documents') and private.has_permission('suppliers.manage'))
with check (bucket_id in ('partner-application-media','partner-application-documents') and private.has_permission('suppliers.manage') and name!~ '(^|/)\.\.(/|$)');
create policy partner_storage_staff_delete on storage.objects for delete to authenticated
using (bucket_id in ('partner-application-media','partner-application-documents') and private.has_permission('suppliers.manage'));

create policy accounting_receipts_finance_read on storage.objects for select to authenticated
using (bucket_id='accounting-receipts' and private.has_permission('finance.payments.manage'));
create policy accounting_receipts_finance_insert on storage.objects for insert to authenticated
with check (bucket_id='accounting-receipts' and private.has_permission('finance.payments.manage') and name!~ '(^|/)\.\.(/|$)');
create policy accounting_receipts_finance_update on storage.objects for update to authenticated
using (bucket_id='accounting-receipts' and private.has_permission('finance.payments.manage'))
with check (bucket_id='accounting-receipts' and private.has_permission('finance.payments.manage') and name!~ '(^|/)\.\.(/|$)');
create policy accounting_receipts_finance_delete on storage.objects for delete to authenticated
using (bucket_id='accounting-receipts' and private.has_permission('finance.payments.manage'));

notify pgrst,'reload schema';
commit;
