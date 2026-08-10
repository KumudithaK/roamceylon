begin;

-- Journey Designers obtain proposal selling totals through the redacted proposal
-- API. They do not require direct access to accounting rows, which also contain
-- internal cost, margin and payment information.
delete from public.staff_role_permissions
where role_code='journey_designer' and permission_code='finance.revenue.view';

commit;
