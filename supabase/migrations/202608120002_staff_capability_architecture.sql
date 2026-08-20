begin;

-- Phase 3 makes named capabilities authoritative. The legacy profile role is
-- retained for compatibility, but `editor` no longer creates staff authority.
insert into public.permissions(code,description) values
  ('journey.proposal.send','Send an internally approved journey proposal to a traveller'),
  ('journey.proposal.manage','Approve or revoke traveller proposal access'),
  ('finance.settlements.reverse','Reverse a posted supplier settlement with an audit reason'),
  ('finance.accounts.override','Force-close a journey account with a documented balance adjustment')
on conflict(code) do update set description=excluded.description;

insert into public.staff_roles(code,name,description) values
  ('super_admin','Super Admin / Founder','Explicit all-capability application administrator.'),
  ('journey_designer','Journey Designer','Traveller briefs, Journey Studio, proposal preparation and sending.'),
  ('partner_manager','Partner / Experience Manager','Partner records, supplier rates and journey allocation.'),
  ('finance','Finance','Revenue, supplier costs, margins, payments and settlement correction.'),
  ('operations','Operations','Accepted-journey delivery, confirmations and benefit fulfilment.'),
  ('content_marketing','Content / Marketing','Themes, destinations, experiences and editorial content.')
on conflict(code) do update set name=excluded.name,description=excluded.description;

-- Remove only the automatic legacy-editor grants created by the original RBAC
-- bootstrap. Assignments made deliberately by a staff administrator are kept.
delete from public.profile_staff_roles assignment
using public.profiles profile
where assignment.profile_id=profile.id
  and profile.role='editor'
  and assignment.assigned_by is null
  and assignment.role_code in ('journey_designer','content_marketing');

delete from public.staff_role_permissions
where role_code in ('super_admin','journey_designer','partner_manager','finance','operations','content_marketing');

insert into public.staff_role_permissions(role_code,permission_code) values
  ('journey_designer','journey.requests.view'),
  ('journey_designer','journey.design.view'),
  ('journey_designer','journey.design.edit'),
  ('journey_designer','journey.proposal.view'),
  ('journey_designer','journey.proposal.create'),
  ('journey_designer','journey.proposal.send'),
  ('journey_designer','suppliers.view'),
  ('journey_designer','benefits.view'),
  ('journey_designer','benefits.assign'),

  ('partner_manager','journey.requests.view'),
  ('partner_manager','journey.design.view'),
  ('partner_manager','suppliers.view'),
  ('partner_manager','suppliers.manage'),
  ('partner_manager','suppliers.allocate'),
  ('partner_manager','suppliers.rates.view'),
  ('partner_manager','benefits.view'),
  ('partner_manager','benefits.manage'),
  ('partner_manager','benefits.assign'),
  ('partner_manager','benefits.reference.view'),
  ('partner_manager','benefits.reference.manage'),

  ('operations','journey.requests.view'),
  ('operations','journey.design.view'),
  ('operations','suppliers.view'),
  ('operations','operations.view'),
  ('operations','operations.manage'),
  ('operations','benefits.view'),
  ('operations','benefits.assign'),

  ('finance','journey.requests.view'),
  ('finance','journey.design.view'),
  ('finance','journey.proposal.view'),
  ('finance','suppliers.view'),
  ('finance','suppliers.rates.view'),
  ('finance','benefits.view'),
  ('finance','benefits.reference.view'),
  ('finance','finance.revenue.view'),
  ('finance','finance.costs.view'),
  ('finance','finance.margin.view'),
  ('finance','finance.payments.manage'),
  ('finance','finance.settlements.reverse'),

  ('content_marketing','cms.view'),
  ('content_marketing','cms.edit');

insert into public.staff_role_permissions(role_code,permission_code)
select 'super_admin',code from public.permissions;

commit;
