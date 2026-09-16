# CR2 Batch 5 — Partner and commercial enquiry experience

## Scope and baseline

- Baseline branch: `commercial-readiness/staging`
- Baseline commit: `3e17da446ac8834e2dd8b6d1829d725cb1e95e74`
- Public surfaces: `/partners`, `/partners/apply`, `/partners/application-received`
- Submission boundary: `POST /api/partner-applications`
- Production, migrations, Supabase configuration, RLS and Storage policy are unchanged.

## Existing workflow contract preserved

The public application remains a four-step, browser-draft workflow. It keeps the existing partner types, field names, validation rules, multipart payload, UUID submission key, digest-based idempotent replay, honeypot, bounded request size, per-email rate limit, URL validation, file count/size/type/signature checks and server-generated application reference.

A new submission can create:

1. one `partner_applications` row with status `submitted`;
2. optional private objects in `partner-application-media` and/or `partner-application-documents`;
3. matching `partner_application_files` rows; and
4. one `partner_application_history` row.

The existing failure path still removes any objects uploaded during a failed attempt and removes the incomplete application. No email, webhook, analytics event, queue or other third-party side effect was found in this public submission path.

## Experience changes

- Reframed the public partner page as a restrained editorial invitation rather than a marketplace or guaranteed-lead proposition.
- Removed unsupported implications of qualified enquiries, guaranteed visibility, rates, availability or an automatic commercial agreement.
- Added explicit statements that submission starts manual review and does not guarantee work, publication, an account or acceptance.
- Connected the partner narrative to existing published Editions, destinations and experiences through the current public content service. Internal `theme` architecture is unchanged.
- Added a resilient editorial image treatment with a designed fallback so a failed editorial image cannot expose a broken-image icon.
- Reworked the application into a clearly labelled four-step conversation while preserving its exact submission contract.
- Made optional uploads and the final production-write boundary explicit.
- Reworked the acknowledgement page around the authoritative server-generated application reference and truthful next steps.

## Accessibility and responsive checks

- Required fields expose native `required` semantics and remain associated with visible labels.
- Step progress is an ordered list with `aria-current="step"`.
- Validation feedback is an assertive live alert and receives focus after failed validation.
- Navigation controls are explicit non-submit buttons until the final action.
- The final action states that it creates a real application and optional private uploads.
- Manual browser checks covered 1440px, 1280px, 768px and 390px widths with no horizontal overflow or broken images.
- Keyboard checks confirmed ordered field traversal, Enter-key progression, focused validation feedback and no accidental crossing of the final submission boundary.

## Regression coverage

- `tests/cr2-batch-5-partner-experience.test.ts` protects truthful public copy, dynamic published-content integration, Edition presentation, the draft/API contract, accessibility semantics, server-reference acknowledgement and unchanged storage/rollback architecture.
- `tests/browser/partner-experience.spec.ts` covers labelled required fields, validation focus, keyboard progression without submission and 390px usability.
- The shared Playwright fixture now uses the production build/start path to avoid development watcher instability.

## Functional correction checkpoint

Correction baseline: `fc5f9c7fba1ed11b50b2a01a16fefa26d3ddd9d8`.

- Explicit `?type=accommodation|vehicle|guide` route intent now takes precedence over a stale `roam-ceylon-partner-draft`; common contact/context data is preserved while incompatible service data and entries are cleared.
- District is the applicant-controlled location field. Province is derived from the complete 25-district Sri Lankan mapping, displayed read-only and normalized when older drafts load.
- Guide destination and experience coverage use the published staging catalogue through searchable, keyboard-operable multi-selects. `Island Wide` and `Any Experience` are mutually exclusive with specific records. The existing JSON application-data boundary is preserved by serializing labels to the established string fields.
- The Context step now enforces the trimmed 30-character introduction minimum before Service. Server validation remains defence in depth.
- Optional photo and verification-document guidance now varies truthfully by partner type.
- The human-observed indefinite submit state had two coupled causes: optional files were advertised up to 10/15 MB even though Vercel Functions reject request bodies above 4.5 MB, and the client awaited `response.json()` without a `catch/finally`. A platform-generated non-JSON 413 therefore bypassed the reset path. Files are now capped at 3 MB each and 3.5 MB combined, the server boundary is 4 MB, non-JSON failures receive truthful feedback, the same idempotency key is retained for retry, and `finally` always exits the busy state.
- Submission history insertion is now checked; a failed history write enters the existing upload/application rollback path rather than returning a partial success.
- No migration, table, Storage bucket, Auth architecture, Production configuration or Production deployment was changed.

## Deployment and human review

The release remains a staging-only candidate. After publication, verify `/partners`, `/partners/apply` and `/partners/application-received` on the persistent staging alias at desktop, tablet and mobile widths. Do not submit an application during the automated/deployed smoke. A separately controlled human test submission remains outside this Batch 5 checkpoint.

Human visual approval is required before CR2 Batch 5 is accepted. Batch 6 must not start automatically.
