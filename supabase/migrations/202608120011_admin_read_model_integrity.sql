begin;

-- Every named staff role may open the command centre, but each section below
-- is independently capability-gated. This permission grants no underlying
-- business-row access by itself.
insert into public.permissions(code,description) values
  ('admin.dashboard.view','Open the role-aware administrative command centre.')
on conflict(code) do update set description=excluded.description;

insert into public.staff_role_permissions(role_code,permission_code)
select role.code,'admin.dashboard.view'
from public.staff_roles role
where role.code in (
  'super_admin','journey_designer','partner_manager','finance','operations','content_marketing'
)
on conflict do nothing;

-- Phase 5 established this as the active, non-contact journey list contract.
-- Re-declaring the evidence-backed contract makes clean migration application
-- deterministic and repairs targets that missed the Phase 5 projection. It is
-- not a new source of truth: every value is derived from enquiries.
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

revoke all on public.staff_journey_request_summary from public,anon;
grant select on public.staff_journey_request_summary to authenticated,service_role;

comment on view public.staff_journey_request_summary is
  'Phase 5/11 purpose-limited staff journey list. Excludes contact details, notes and copied JSON; traveller name is capability-conditioned.';

-- One stable, read-only RPC supplies the dashboard. It never accepts row IDs,
-- filters, sort expressions or pagination from the browser, so parameters
-- cannot expand authorization scope. Every section is absent (null) unless
-- the caller has its purpose capability.
create or replace function public.read_admin_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  can_dashboard boolean := private.has_permission('admin.dashboard.view');
  can_journeys boolean := private.has_permission('journey.requests.view')
    or private.has_permission('traveller.pii.full.view');
  can_content boolean := private.has_permission('cms.view');
  can_suppliers boolean := private.has_permission('suppliers.view');
  can_finance boolean := private.has_permission('finance.revenue.view');
  can_operations boolean := private.has_permission('operations.view');
  journey_section jsonb := null;
  content_section jsonb := null;
  supplier_section jsonb := null;
  finance_section jsonb := null;
  operations_section jsonb := null;
  content_resources jsonb := '[]'::jsonb;
  supplier_resources jsonb := '[]'::jsonb;
begin
  if (select auth.uid()) is null or not can_dashboard then
    raise insufficient_privilege using message='Administrative dashboard access denied.';
  end if;

  if can_journeys then
    select jsonb_build_object(
      'newLeads',count(*) filter(where e.status='new'),
      'activeQuotes',count(*) filter(where e.status in (
        'under_review','preparing_proposal','proposal_sent','awaiting_traveller_approval',
        'proposal_accepted','deposit_requested','deposit_paid'
      )),
      'confirmedJourneys',count(*) filter(where e.status in (
        'journey_confirmed','ready_for_operations','travelling'
      )),
      'openPipelineValue',coalesce(sum(
        case when e.status not in ('completed','cancelled','archived') then coalesce(
          (
            select p.total_selling_price
            from public.journey_proposals p
            where p.enquiry_id=e.id
              and p.status not in ('superseded','cancelled','expired')
            order by p.version desc
            limit 1
          ),
          case
            when e.estimated_price_basis='total' then e.estimated_price_max
            when e.estimated_price_basis='per_person' then e.estimated_price_max*(e.adults+e.children)
            else null
          end,
          0
        ) else 0 end
      ),0),
      'currency','USD',
      'pipeline',jsonb_build_array(
        jsonb_build_object('status','new','count',count(*) filter(where e.status='new')),
        jsonb_build_object('status','under_review','count',count(*) filter(where e.status='under_review')),
        jsonb_build_object('status','preparing_proposal','count',count(*) filter(where e.status='preparing_proposal')),
        jsonb_build_object('status','proposal_sent','count',count(*) filter(where e.status='proposal_sent')),
        jsonb_build_object('status','journey_confirmed','count',count(*) filter(where e.status='journey_confirmed'))
      ),
      'recent',(
        select coalesce(jsonb_agg(jsonb_build_object(
          'id',recent.id,
          'journey_reference',recent.journey_reference,
          'created_at',recent.created_at,
          'status',recent.status,
          'traveller_name',case
            when private.has_permission('traveller.pii.design.view')
              or private.has_permission('traveller.pii.finance.view')
              or private.has_permission('traveller.pii.full.view') then recent.name
            when private.has_permission('traveller.pii.operations.view') and recent.status in (
              'proposal_accepted','deposit_requested','deposit_paid','journey_confirmed',
              'ready_for_operations','travelling','completed','cancelled'
            ) then recent.name
            else null
          end,
          'adults',recent.adults,
          'children',recent.children,
          'destination_count',jsonb_array_length(recent.selected_destinations),
          'estimated_price_min',recent.estimated_price_min,
          'estimated_price_max',recent.estimated_price_max,
          'estimated_price_currency',recent.estimated_price_currency,
          'estimated_price_basis',recent.estimated_price_basis
        ) order by recent.created_at desc),'[]'::jsonb)
        from (
          select e2.* from public.enquiries e2 order by e2.created_at desc limit 5
        ) recent
      )
    ) into journey_section
    from public.enquiries e;
  end if;

  if can_content then
    select jsonb_build_array(
      jsonb_build_object('label','Themes','href','/admin/diagnostics','total',count(*),'published',count(*) filter(where status='published'),'review',count(*) filter(where status='in_review'),'draft',count(*) filter(where status='draft'),'missingImage',count(*) filter(where hero_image_url is null or btrim(hero_image_url)=''))
    ) into content_resources from public.themes;
    select content_resources || jsonb_build_array(
      jsonb_build_object('label','Destinations','href','/admin/resources/destinations','total',count(*),'published',count(*) filter(where status='published'),'review',count(*) filter(where status='in_review'),'draft',count(*) filter(where status='draft'),'missingImage',count(*) filter(where hero_image_url is null or btrim(hero_image_url)=''))
    ) into content_resources from public.destinations;
    select content_resources || jsonb_build_array(
      jsonb_build_object('label','Experiences','href','/admin/resources/experiences','total',count(*),'published',count(*) filter(where status='published'),'review',count(*) filter(where status='in_review'),'draft',count(*) filter(where status='draft'),'missingImage',count(*) filter(where hero_image_url is null or btrim(hero_image_url)=''))
    ) into content_resources from public.experiences;
  end if;

  if can_suppliers then
    select jsonb_build_array(
      jsonb_build_object('label','Stays','href','/admin/resources/stays','total',count(*),'published',count(*) filter(where status='published'),'review',count(*) filter(where status='in_review'),'draft',count(*) filter(where status='draft'),'missingImage',count(*) filter(where hero_image_url is null or btrim(hero_image_url)=''))
    ) into supplier_resources from public.accommodations;
    select supplier_resources || jsonb_build_array(
      jsonb_build_object('label','Vehicles','href','/admin/resources/vehicles','total',count(*),'published',count(*) filter(where status='published'),'review',count(*) filter(where status='in_review'),'draft',count(*) filter(where status='draft'),'missingImage',count(*) filter(where hero_image_url is null or btrim(hero_image_url)=''))
    ) into supplier_resources from public.vehicles;
    select supplier_resources || jsonb_build_array(
      jsonb_build_object('label','Guides','href','/admin/resources/guides','total',count(*),'published',count(*) filter(where status='published'),'review',count(*) filter(where status='in_review'),'draft',count(*) filter(where status='draft'),'missingImage',count(*) filter(where profile_image_url is null or btrim(profile_image_url)=''))
    ) into supplier_resources from public.guides;

    select jsonb_build_object(
      'total',count(*),
      'pending',count(*) filter(where status::text in ('submitted','under_review','needs_information','pending')),
      'newSubmissions',count(*) filter(where status::text in ('submitted','pending'))
    ) into supplier_section
    from public.partner_applications;
  end if;

  if can_content or can_suppliers then
    content_section := jsonb_build_object('resources',content_resources || supplier_resources);
  end if;

  if can_finance then
    select jsonb_build_object(
      'activeAccounts',count(*) filter(where a.active),
      'revenue',coalesce(sum(a.selling_price) filter(where a.active and a.status not in ('cancelled','refund_pending','refunded')),0),
      'received',coalesce(sum(a.amount_received) filter(where a.active),0),
      'refunded',coalesce(sum(a.amount_refunded) filter(where a.active),0),
      'supplierPaid',coalesce(sum(a.supplier_paid) filter(where a.active),0),
      'currency',coalesce(min(a.currency) filter(where a.active),'USD')
    ) into finance_section
    from public.journey_accounts a;
  end if;

  if can_operations then
    select jsonb_build_object(
      'ready',count(*) filter(where e.status='ready_for_operations'),
      'travelling',count(*) filter(where e.status='travelling'),
      'completed',count(*) filter(where e.status='completed'),
      'pendingFulfilments',(
        select count(*) from public.journey_supplier_allocations allocation
        join public.enquiries journey on journey.id=allocation.enquiry_id
        where journey.status in ('ready_for_operations','travelling')
          and allocation.confirmation_status='confirmed'
          and allocation.fulfilment_status='pending'
      ),
      'fulfilledServices',(
        select count(*) from public.journey_supplier_allocations allocation
        where allocation.fulfilment_status='fulfilled'
      )
    ) into operations_section
    from public.enquiries e;
  end if;

  return jsonb_build_object(
    'journeys',journey_section,
    'content',content_section,
    'partners',supplier_section,
    'finance',finance_section,
    'operations',operations_section
  );
end;
$$;

revoke all on function public.read_admin_dashboard() from public,anon;
grant execute on function public.read_admin_dashboard() to authenticated,service_role;

comment on function public.read_admin_dashboard() is
  'Role-aware, PII-minimized, read-only administrative dashboard derived from authoritative journey, proposal, supplier, accounting and operational state.';

notify pgrst,'reload schema';
commit;
