-- Allow authenticated CMS staff to use the public relationship editor without
-- granting broad access to the private authorization schema.
--
-- The function performs its own role check before writing and accepts only the
-- explicitly supported relationship resource types.

alter function public.sync_content_relationships(text,uuid,uuid[],uuid[],uuid[])
  security definer;

revoke all on function public.sync_content_relationships(text,uuid,uuid[],uuid[],uuid[]) from public;
revoke all on function public.sync_content_relationships(text,uuid,uuid[],uuid[],uuid[]) from anon;
grant execute on function public.sync_content_relationships(text,uuid,uuid[],uuid[],uuid[]) to authenticated;

comment on function public.sync_content_relationships(text,uuid,uuid[],uuid[],uuid[]) is
  'Atomically replaces CMS relationship mappings for authorized administrators and editors without exposing the private authorization schema.';
