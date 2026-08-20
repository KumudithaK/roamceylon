# Roam Ceylon Production Smoke Test Checklist

Status: **prepared for a later human-approved cutover; not executed**

Use one clearly synthetic identity/reference namespace such as `launch-smoke-<date>` and the reserved non-deliverable domain `.invalid`. Never use real traveller, partner or supplier details for smoke testing.

## Preconditions

- [ ] Cutover and backup evidence is signed.
- [ ] Exact release artifact and migration manifests are recorded.
- [ ] Production project reference is confirmed explicitly.
- [ ] Browser developer tools show the expected production origin and Supabase project.
- [ ] A Super Admin and least-privilege staff test accounts exist through controlled bootstrap.
- [ ] The operator has an agreed procedure for cancelling/retiring smoke records without deleting immutable history.

## Public

- [ ] Homepage returns 200, correct branding/media fallback and no console/runtime error.
- [ ] Theme, destination and experience lists show only published/active content.
- [ ] One destination and one experience detail page load expected relationships and images.
- [ ] Journey Builder starts empty, accepts a small route, validates traveller/dates and shows a planning range.
- [ ] Submit one minimal enquiry with a `launch-smoke-*@example.invalid` address; receive one journey reference.
- [ ] Replay the same submission key/body and confirm no duplicate enquiry.
- [ ] Partner application page loads, validates fields/files and does not expose private applications. Do not submit unless onboarding smoke is explicitly authorized.
- [ ] A valid synthetic proposal link is private/no-store/noindex; an invalid token gives a generic unavailable result.

## Admin and roles

- [ ] Staff login succeeds with the controlled account and generic failure text appears for invalid credentials.
- [ ] Dashboard and `staff_journey_request_summary` load without schema-cache errors.
- [ ] Journey Designer sees the minimized traveller brief and cannot access Finance-only data.
- [ ] Partner Manager sees supplier/onboarding functions and not full traveller PII.
- [ ] Finance sees accounting functions and not full traveller base rows.
- [ ] Operations sees operational context and not Finance internals.
- [ ] Content Marketing can edit CMS content and cannot access traveller/finance data.
- [ ] Super Admin has the intended capability set without direct lifecycle, accounting or audit bypass.

## Security

- [ ] Anonymous Admin route/API access is denied.
- [ ] Anonymous supplier base rows/contact/licence fields are denied; public projections still work.
- [ ] Anonymous website setup state is denied; website public settings still work.
- [ ] Wrong-role traveller PII access is denied/minimized.
- [ ] Staff self-escalation and direct profile-role mutation are denied.
- [ ] Direct lifecycle, proposal, accounting, allocation, fulfilment and audit-table mutations are denied.
- [ ] CSP, no-referrer, nosniff, frame denial, permissions policy and HSTS are present on HTTPS production responses.
- [ ] Proposal routes return `Cache-Control: private, no-store` and `X-Robots-Tag: noindex, nofollow, noarchive`.
- [ ] No response or application log exposes credentials, bearer tokens, proposal tokens, request bodies or PII.

## Minimal business flow

- [ ] Open the synthetic enquiry in Journey Studio and create the smallest valid curated journey.
- [ ] Allocate one approved synthetic/controlled supplier service using a saved rate.
- [ ] Generate, approve and send one synthetic proposal.
- [ ] Accept through the exact synthetic token/identity once; replay is safe.
- [ ] Confirm one account initialization; do not post real payment.
- [ ] Verify Admin read models and audit evidence reflect exactly one business outcome.
- [ ] Do not exercise refunds, supplier payments or destructive actions in production smoke testing.

## Storage

- [ ] `travel-content` public read works; unauthorized write is denied.
- [ ] Authorized Content Marketing upload uses the canonical resource path and allowed MIME/size.
- [ ] Partner media/document and accounting receipt buckets remain private.
- [ ] Authorized role can create a signed URL for the correct private object; wrong-role and cross-path access are denied.
- [ ] Remove only disposable smoke media through the authorized UI/Storage operation; do not touch real objects.

## Closeout

- [ ] Cancel/retire the synthetic enquiry/journey through authoritative lifecycle commands.
- [ ] Reject or retire any synthetic partner application through its command flow.
- [ ] Remove disposable Storage objects; verify no orphaned smoke object remains.
- [ ] Preserve immutable command/audit evidence and label it as launch smoke.
- [ ] Record public/Admin/security results, timestamps, operator and independent reviewer.
- [ ] On any security, accounting, schema-cache or duplication failure: stop launch, preserve evidence and follow `production-cutover-plan.md` recovery rules.
