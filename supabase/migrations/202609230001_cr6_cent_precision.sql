-- CR6-R1: reject sub-cent monetary values at the durable staging boundary.
-- No existing values are rewritten. Ratios, percentages, quantities and distances
-- deliberately remain outside this two-decimal money contract.

create or replace function private.finance_snapshot_cent_precise(value jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  item record;
  child jsonb;
  normalized_key text;
begin
  if value is null then return true; end if;
  if jsonb_typeof(value) = 'array' then
    for child in select element from jsonb_array_elements(value) as elements(element) loop
      if not private.finance_snapshot_cent_precise(child) then return false; end if;
    end loop;
  elsif jsonb_typeof(value) = 'object' then
    for item in select key, element from jsonb_each(value) as elements(key, element) loop
      normalized_key := lower(regexp_replace(item.key, '[^a-zA-Z0-9]', '', 'g'));
      if jsonb_typeof(item.element) = 'number' and normalized_key = any(array[
        'amount','price','unitprice','suppliercost','sellingprice','totalsuppliercost',
        'totalsellingprice','grossprofit','internalcost','operationscost',
        'manualsellingfloor','administrationfee','servicefee','contingency',
        'depositamount','balanceamount','total','priceperperson','estimateddailycost',
        'estimatedpricemin','estimatedpricemax','minimum','maximum',
        'amountreceived','amountrefunded','amountpaid','amountdue','waivedamount',
        'customerpaid','supplierpaid','suppliersavings','verifiedsavings',
        'customerrate','referencerate','approvedrefund','calculatedrefund',
        'recommendedrefund','cancellationfee','admincharge','othernonrecoverablecost',
        'supplierexposure','suppliernonrecoverable','supplierrecoverable',
        'driveroperations','fuel','tolls','parking','guideaccommodation',
        'administration','deposit','balance','refund','discount',
        'driversalaryperday','fuelpriceperlitre','tollsperjourney','parkingperday',
        'guideaccommodationpernight','administrationfixed','servicefeefixed',
        'airporttransfereachway','nightlyrateusd','dailyrateusd','perkmrateusd',
        'priceperpersonusd','activityperguestusd','guidedefaultdailyrateusd',
        'applicationfeeamount','listingfeeamount'
      ]) then
        if (item.element #>> '{}')::numeric <> round((item.element #>> '{}')::numeric, 2) then
          return false;
        end if;
      elsif jsonb_typeof(item.element) in ('object','array') then
        if not private.finance_snapshot_cent_precise(item.element) then return false; end if;
      end if;
    end loop;
  end if;
  return true;
end;
$$;

comment on function private.finance_snapshot_cent_precise(jsonb) is
  'Checks known monetary keys in financial JSON snapshots without constraining quantities, ratios or distances.';

-- Existing numeric(p,2) columns already persist cents, but would silently round
-- incoming sub-cent values. Remove only that coercion; the checks below reject it.
alter table public.benefit_definitions
  alter column customer_rate type numeric,
  alter column reference_rate type numeric;
-- PostgreSQL will not change a column's type while an UPDATE OF trigger names it.
-- Recreate the exact existing trigger within this atomic migration.
drop trigger mark_proposal_after_benefit_change on public.journey_benefits;
alter table public.journey_benefits
  alter column customer_rate type numeric,
  alter column reference_rate type numeric,
  alter column verified_savings type numeric;
create trigger mark_proposal_after_benefit_change
after update of included, scope_type, scope_id, journey_day, customer_title,
  customer_description, confidence_status, quantity, reference_rate,
  customer_rate, currency, rate_unit, comparison_verified, verified_savings
on public.journey_benefits for each row
execute function private.mark_active_proposal_out_of_date();
alter table public.journey_estimate_bands
  alter column minimum type numeric,
  alter column maximum type numeric;

do $$
declare
  field_spec text;
  target_table text;
  target_column text;
  max_abs text;
  constraint_name text;
begin
  foreach field_spec in array array[
    'accommodations.nightly_rate_usd',
    'accounting_transactions.amount',
    'benefit_definitions.customer_rate:1000000000000',
    'benefit_definitions.reference_rate:1000000000000',
    'enquiries.estimated_price_min', 'enquiries.estimated_price_max',
    'experiences.price_per_person_usd', 'guides.daily_rate_usd',
    'journey_accounts.selling_price', 'journey_accounts.internal_cost',
    'journey_accounts.gross_profit', 'journey_accounts.amount_received',
    'journey_accounts.amount_refunded', 'journey_accounts.supplier_paid',
    'journey_accounts.supplier_savings', 'journey_accounts.closure_adjustment',
    'journey_benefits.customer_rate:1000000000000',
    'journey_benefits.reference_rate:1000000000000',
    'journey_benefits.verified_savings:1000000000000',
    'journey_cancellation_cases.admin_charge',
    'journey_cancellation_cases.approved_refund',
    'journey_cancellation_cases.calculated_refund',
    'journey_cancellation_cases.cancellation_fee',
    'journey_cancellation_cases.customer_paid',
    'journey_cancellation_cases.other_non_recoverable_cost',
    'journey_cancellation_cases.recommended_refund',
    'journey_cancellation_cases.supplier_exposure',
    'journey_cancellation_cases.supplier_non_recoverable',
    'journey_cancellation_cases.supplier_recoverable',
    'journey_estimate_bands.minimum:10000000000',
    'journey_estimate_bands.maximum:10000000000',
    'journey_pricing_settings.activity_per_guest_usd',
    'journey_pricing_settings.guide_default_daily_rate_usd',
    'journey_proposal_acceptances.accepted_total',
    'journey_proposals.total_supplier_cost',
    'journey_proposals.total_selling_price',
    'journey_proposals.gross_profit',
    'journey_settlements.amount_due', 'journey_settlements.amount_paid',
    'journey_settlements.cancellation_non_recoverable_amount',
    'journey_settlements.waived_amount',
    'journey_supplier_allocations.supplier_cost',
    'journey_supplier_allocations.selling_price',
    'partner_commercial_settings.application_fee_amount',
    'partner_commercial_settings.listing_fee_amount',
    'pricing_plans.price',
    'supplier_recoverability_history.from_non_recoverable_amount',
    'supplier_recoverability_history.to_non_recoverable_amount',
    'tour_pricing_config.administration_fixed',
    'tour_pricing_config.airport_transfer_each_way',
    'tour_pricing_config.driver_salary_per_day',
    'tour_pricing_config.fuel_price_per_litre',
    'tour_pricing_config.guide_accommodation_per_night',
    'tour_pricing_config.parking_per_day',
    'tour_pricing_config.service_fee_fixed',
    'tour_pricing_config.tolls_per_journey',
    'tour_supplier_costs.amount',
    'vehicles.daily_rate_usd', 'vehicles.per_km_rate_usd'
  ] loop
    target_table := split_part(field_spec, '.', 1);
    target_column := split_part(split_part(field_spec, '.', 2), ':', 1);
    max_abs := nullif(split_part(field_spec, ':', 2), '');
    constraint_name := target_table || '_' || target_column || '_cent_precision';
    execute format(
      'alter table public.%I add constraint %I check (%I::text not in (''NaN'', ''Infinity'', ''-Infinity'') and %I = round(%I, 2)%s)',
      target_table, constraint_name, target_column, target_column, target_column,
      case when max_abs is null then '' else format(' and abs(%I) < %s', target_column, max_abs) end
    );
  end loop;
end;
$$;

alter table public.enquiries add constraint enquiries_estimate_snapshot_cent_precision
  check (private.finance_snapshot_cent_precise(estimate_snapshot));
alter table public.journey_supplier_allocations add constraint allocations_rate_snapshot_cent_precision
  check (private.finance_snapshot_cent_precise(pricing_plan_snapshot));
alter table public.journey_proposals add constraint proposals_financial_snapshots_cent_precision
  check (private.finance_snapshot_cent_precise(allocation_snapshot)
    and private.finance_snapshot_cent_precise(commercial_snapshot)
    and private.finance_snapshot_cent_precise(customer_snapshot)
    and private.finance_snapshot_cent_precise(sent_snapshot));
alter table public.journey_accounts add constraint accounts_quote_snapshot_cent_precision
  check (private.finance_snapshot_cent_precise(quote_snapshot));
