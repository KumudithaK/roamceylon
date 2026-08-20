begin;

-- pricing_plans.entity_type is an enum while allocation_type and JSON values
-- are text. Compare their stable textual representations explicitly.
do $repair$
declare
  definition text;
  original text;
begin
  select pg_get_functiondef(
    'private.validate_supplier_allocation(public.journey_supplier_allocations)'::regprocedure
  ) into definition;
  original := definition;
  definition := replace(
    definition,
    'plan_row.entity_type<>allocation.allocation_type',
    'plan_row.entity_type::text<>allocation.allocation_type'
  );
  if definition = original then
    raise exception 'Expected allocation validator enum/text comparison was not found; repair refused.';
  end if;
  execute definition;

  select pg_get_functiondef(
    'public.save_supplier_allocations_command(uuid,uuid,jsonb,uuid,text)'::regprocedure
  ) into definition;
  original := definition;
  definition := replace(
    definition,
    'plan_row.entity_type<>item->>''allocation_type''',
    'plan_row.entity_type::text<>item->>''allocation_type'''
  );
  if definition = original then
    raise exception 'Expected allocation command enum/text comparison was not found; repair refused.';
  end if;
  execute definition;
end
$repair$;

revoke all on function private.validate_supplier_allocation(public.journey_supplier_allocations)
  from public, anon, authenticated;
revoke all on function public.save_supplier_allocations_command(uuid,uuid,jsonb,uuid,text)
  from public, anon, authenticated;
grant execute on function public.save_supplier_allocations_command(uuid,uuid,jsonb,uuid,text)
  to service_role;

notify pgrst, 'reload schema';

commit;
