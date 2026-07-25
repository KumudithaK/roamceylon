alter type public.content_status add value if not exists 'in_review' after 'draft';
alter type public.partner_application_status add value if not exists 'under_review' after 'pending';
