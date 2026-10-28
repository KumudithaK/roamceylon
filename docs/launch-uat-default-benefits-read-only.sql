-- UAT budget verification only. Not a migration, seed or workflow command.
-- Linked project must be hvcggnuptrcsxtrcjnre before this file is submitted.
BEGIN READ ONLY;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';
WITH applicable AS (
  SELECT id, code, default_scope, entity_type, entity_id
  FROM public.benefit_definitions
  WHERE active AND default_included
    AND (valid_from IS NULL OR valid_from <= (current_timestamp AT TIME ZONE 'UTC')::date)
    AND (valid_to IS NULL OR valid_to >= (current_timestamp AT TIME ZONE 'UTC')::date)
    AND (entity_type IS NULL
      OR (entity_type = 'destination' AND entity_id = '057e9d8a-483d-4628-803f-e4b6c9ff96b3'::uuid)
      OR (entity_type = 'experience' AND entity_id = 'a8add685-dd52-4a23-b5c3-121b54806d13'::uuid))
)
SELECT jsonb_build_object(
  'status', 'READ_ONLY_UAT_DEFAULT_BENEFIT_COUNT',
  'project', 'hvcggnuptrcsxtrcjnre',
  'recordedAt', current_timestamp,
  'backend', pg_backend_pid(),
  'definitionRows', (SELECT count(*) FROM public.benefit_definitions),
  'existingJourneyBenefitRows', (SELECT count(*) FROM public.journey_benefits),
  'applicableDefaultCount', (SELECT count(*) FROM applicable),
  'applicableDefaults', (SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY a.code), '[]'::jsonb) FROM applicable a),
  'mutations', 0
) AS uat_default_benefit_proof;
ROLLBACK;
