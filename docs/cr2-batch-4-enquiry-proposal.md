# CR2 Batch 4 — Enquiry and journey-proposal handoff

## Scope and baseline

Batch 4 refines the public transition from the completed Journey Builder review to a traveller enquiry. The implementation started from `9ee6cbbdf58b72e068776988c371ac5f464a80ed` on `commercial-readiness/staging`. It does not change the database schema, API route, production configuration, pricing configuration, Admin design, or proposal-generation workflow.

No real staging or production enquiry was created during implementation. Contract verification uses source inspection and isolated automated tests.

## Architecture discovered

1. Journey selections live in `JourneyProvider` and remain persisted under `roam-ceylon-journey-v3` with legacy `roam-ceylon-journey-v2` restoration.
2. The Review chapter and its summary both open `QuotationModal` only after the existing journey-detail validation passes.
3. The modal serialises a version-one `JourneyQuotationHandoff`, including the complete state and the current public estimate, into the established enquiry payload.
4. The browser sends a relative `POST /api/enquiries`; no personal data is placed in the URL.
5. The strict server route validates a bounded JSON body, requires an empty honeypot, enforces at least one adult, and accepts only the established public fields.
6. The route checks the opaque UUID submission key. A replay with the same server digest returns the original reference; a substituted payload returns HTTP 409.
7. A process-local email-identity rate limit permits five attempts per hour per running instance.
8. The privileged server boundary inserts exactly one `public.enquiries` row with authoritative `status = new`. The database supplies the unique `RCJ-YYYY-XXXXXXXX` reference.
9. The route returns the genuine database reference. The client displays that value and generates no substitute.
10. Staff Traveller Enquiries consumes `staff_journey_request_summary` and the protected enquiry detail contract. Journey Studio parses the stored `trip_state` handoff, with a legacy-row fallback, and creates `curated_journeys` only through a later authenticated staff action.

## Contracts preserved

- `roam-ceylon-journey-v3`
- `roam-ceylon-journey-v2`
- `roam-ceylon-quotation-handoff-v1`
- `roam-ceylon-partner-draft`
- `RCJ-*`
- `public.enquiries`
- `public.curated_journeys`
- Existing Journey Builder request fields and estimate snapshot
- Existing Admin and Journey Studio readers

No table, column, route, storage key, internal Theme identifier, or server-side validation contract was renamed.

## Baseline behaviour

The former modal collected full name, required WhatsApp number, email, optional country, arrival and departure dates, and optional notes. It repeated dates already validated in Journey Details. It disabled the submit button through React Hook Form while submitting and reused a submission UUID for retries. A successful response reset the Journey Builder and displayed the returned reference. A non-OK response retained the journey but network exceptions were not given an explicit controlled failure state.

The former custom dialog handled Escape and body scrolling manually but did not provide a complete focus trap or automatic focus restoration. Its large ivory card visually interrupted the Journey Builder.

## UI and interaction changes

The modal remains because it preserves the existing transition and submission architecture, but it is now an editorial final chapter rather than a generic form card:

- Deep Ceylon Forest journey portrait beside a quiet Warm Ivory form.
- Concise context for Editions, route, dates, travellers, selected experiences and truthful planning-range state.
- Only name and email are required.
- Phone/WhatsApp, country and notes are optional, matching the server contract.
- Dates come from the completed journey and are shown rather than collected a second time.
- The CTA is `Request your journey proposal`, accurately describing an enquiry rather than a booking.
- Submission copy explicitly says that no booking, availability or payment is confirmed.

## Validation and accessibility

React Hook Form and Zod continue to provide client validation while the server remains authoritative. Name and email errors are associated through unique `aria-describedby` values. Optional phone input is checked only when supplied. All public strings remain within server maximums.

Radix Dialog now supplies background inertness, focus containment, Escape handling and focus restoration. Opening focuses the name field. Client validation focuses the first invalid field. A server/network error moves focus to a `role=alert`; success moves focus to the success heading. Controls retain visible focus styles, semantic labels, minimum touch sizes and reduced-motion behaviour from the shared CR2 foundation.

The form stacks naturally below the journey portrait before the desktop two-column composition is safe, and uses a viewport-bounded scroll container for mobile keyboards and short laptop screens.

## Submission and duplicate protection

The browser now creates the submission UUID when the dialog opens and keeps the action disabled until that key exists. Every activation and retry in that dialog therefore uses the same key, including activations occurring before React paints the submitting state. The disabled/`aria-busy` submit button communicates the in-flight state. Server digest comparison and the database unique constraint remain the authoritative duplicate protections.

No distributed idempotency system, new database state, or schema change was introduced.

## Success and failure handling

Success displays only the `reference` returned by the server and identifies it as a journey reference. It confirms receipt of the traveller's request without promising a response time, booking, availability, quotation or consultant assignment. Navigation permits another journey or a return to the public site.

HTTP and network failures keep the modal, entered contact values and persisted Journey Builder state available. The message is customer-safe and does not expose backend errors. HTTP 429 receives a specific restrained message. A retry retains the same idempotency key.

The established post-success behaviour remains: `onSubmitted` resets the Journey Builder to a fresh journey after the server confirms success.

## Planning range

The existing estimate gate is unchanged. A valid `estimated_range` is summarised per person. Staging's current `tailored` result remains visible as `Taking shape — to be reviewed with your request`. No price, supplier rate or commercial configuration is fabricated.

## Notification behaviour

`POST /api/enquiries` inserts the enquiry and returns its reference. No traveller email, staff email, webhook, analytics event, queue or background notification is present in this path. Staff see new records when they load Traveller Enquiries or Journey Studio.

The absence of an automatic operational notification is a commercial-readiness issue for a later controlled batch. Batch 4 does not add an email provider.

## Security and abuse findings

Present controls:

- Strict Zod request schema and rejection of unknown authoritative fields.
- 160 KB streamed and declared-body limit.
- Hidden honeypot that the server requires to be empty.
- Lower-cased email and trimmed bounded strings.
- At least one adult and consistent date/range validation.
- Opaque UUID idempotency key, SHA-256 payload digest and database uniqueness.
- Five-attempt hourly in-memory limit per email identity and running instance.
- Privileged server-only insertion; anonymous direct insert is revoked.
- No PII or journey payload in URLs.

Deferred risks:

- No CAPTCHA or managed bot challenge.
- No explicit same-origin check in the route.
- The rate limiter is process-local and does not provide a shared distributed limit across serverless instances.
- No automated staff notification or monitored delivery queue exists.

These are genuine launch-readiness considerations but do not justify silently adding infrastructure or changing the established boundary during this design batch.

## Data mutation result

- Staging enquiries created: **0**
- Production enquiries created: **0**
- Database migrations: **none**
- Supabase changes: **none**
- Production changes: **none**

## Deferred human review

The deployed Preview must still be reviewed at approximately 1440, 1280, 1024, 768 and 390 pixels for the transition, context balance, keyboard reachability, validation, loading, success and failure treatments. A real staging enquiry remains prohibited until separately authorized; success rendering is verified through tests and local isolated behaviour.
