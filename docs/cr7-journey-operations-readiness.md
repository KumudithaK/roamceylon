# CR7 journey and operations readiness — staging checkpoint

Status: **HOLD pending a realistic staging E2E run against the CR7 application changes**. This document does not certify commercial launch or supplier readiness. Staging project `hvcggnuptrcsxtrcjnre` now has 87 migrations through `202610010001`, recorded exactly once. The human applied the exact-file migration after a rollback-only rehearsal. Independent read-only verification found its three enabled guards and functions, the CR6 protections, unchanged journey/Auth/Storage baselines, and preserved CR5 partner fixtures. A separate transaction-only live test passed accepted-design date/pax handover and post-acceptance itinerary, allocation, proposal and acceptance immutability checks; `ROLLBACK;` left zero fixture enquiries or proposals. CR7-R2 human approval now permits publication of the tested application changes to the protected staging Preview before the E2E. It does not permit Production promotion or a CR7 PASS without live evidence.

## Lifecycle and identity

The public Journey Builder submits one `enquiries` row through `/api/enquiries`. Its `id` is the canonical technical journey ID and `journey_reference` is the human-facing reference. `trip_state`, selected catalogue IDs, dates and traveller counts form an immutable *original request*. The legacy `journey_requests` path is not the active Builder handoff. An enquiry has at most one `curated_journeys` row (`enquiry_id` unique); the designer's itinerary, route, nights, accommodation class, transport legs, guides, experience choices and participant counts live there. `curated_journey_changes` records design history.

`journey_supplier_allocations` belong to the enquiry and, for designed journeys, the curated journey. Service type, scope, provider, quantity, cost, selling price, confirmation, arrival instructions and fulfilment are separate from customer preference fields. Versioned `journey_proposals` retain commercial, supplier and curated-design snapshots; a `journey_proposal_acceptances` row identifies the exact accepted version. `journey_accounts`, accounting transactions and settlements track money independently of operational status. The operational command creates command receipts and requires an accepted current proposal and confirmed accepted services before handover, start and completion. The single enquiry ID links request, design, proposal, account, allocations and operations; related records keep their own audit IDs.

The customer-facing proposal and PDF are proposal snapshots, not a final booking confirmation or voucher. There is no complete automatic final-document/voucher dispatch or emergency response system. Founder-controlled documents and emergency cover remain real-world operating prerequisites.

## Findings and contained remediation

| Priority | Finding | Correction / disposition |
| --- | --- | --- |
| P0 | Operational readiness compared the accepted proposal dates with immutable *original-request* dates. Legitimate designer date changes therefore blocked handover. | Applied staging migration uses accepted sent snapshot dates/pax, requires agreement with the live curated itinerary and confirmed accepted services. Live transaction-only guard checks passed. |
| P0 | The live curated itinerary could change after traveller acceptance; a new supplier allocation or newer proposal could silently change/strand accepted scope. | Applied staging migration blocks those writes after acceptance, under the same enquiry advisory lock as acceptance. Live transaction-only guard checks passed. Local server/UI changes are not yet deployed. A later amendment workflow must explicitly preserve the prior agreement. |
| P0 | Admin lifecycle buttons sent both action and internal notes although the API accepts one or the other. | Split action and notes payloads; unsaved notes must be saved first. |
| P1 | An invalid calendar date or mismatched airport pickup/drop-off date could enter a proposal. | Strict itinerary date validation and proposal-time revalidation. |
| P1 | Admin enquiry overview could imply the original request was the operationally agreed design. | Distinct original-request and designed-journey labels. |

The database trigger remains the authority; UI disabling alone is not a concurrency or access-control boundary. Existing CR6 cent precision, allocation command guards, payment/settlement controls and immutable proposal/account snapshots are unchanged. The technical `theme` vocabulary, historical records, and legacy reference values are unchanged.

## Handoffs and controlled-launch checklist

Before a real journey is marked operationally ready, the founder/authorised staff must:

1. Verify the original traveller request against the designed route, calendar dates, pax, arrival/departure, accommodation class/nights, transport, guides, experiences, accessibility and special requirements. Record material changes with traveller approval.
2. Verify each named supplier is genuinely approved for the exact service/date/capacity, rate/currency/terms, contact and contingency. Do not infer this from a published catalogue item or a synthetic staging record. CR5 currently reports no verified commercial supplier network or rate catalogue.
3. Reconcile every active allocation to the designed requirement; confirm availability and supplier commitment under an approved human process before offering an agreement represented as confirmed. Keep supplier net cost and private contacts away from public proposal fields.
4. Review the generated proposal version, price, deposit/balance terms, inclusions/exclusions, cancellation wording and exact itinerary. Send only the approved version and retain its immutable snapshot and traveller acceptance evidence.
5. Have Finance separately confirm actual traveller payment and supplier-payable evidence. Do not treat a proposal acceptance or a status click as payment, settlement or refund.
6. Check the authoritative operational readiness command. Verify arrival instructions, emergency contact ownership, after-hours coverage, transport handoffs, guide briefing and the final customer documents/vouchers manually before departure.
7. Record fulfilment and completion against the same enquiry ID. For disruption or cancellation, stop new commitments, document the incident, contact the traveller and suppliers using the approved process, and route any credit/refund through the guarded Finance workflow. A cancelled account opens a cancellation case; supplier cancellations and recoverability assessments are not automatic.

Staff capabilities must be checked server-side and through RLS, not inferred from visible navigation. Journey Designer, Partner Manager, Operations and Finance have separate authorities; supplier private contacts and traveller PII must stay within purpose-limited projections. A human must verify the final traveller documents, accessible contact channels, supplier confirmation evidence, local emergency procedure and legal/insurance position before a paid journey.

## Verification still required

- The staging migration is applied and independently verified; do not apply it to production. Publish the reviewed application changes only to the protected, branch-scoped staging Preview under the CR7-R2 approval before creating a persistent synthetic journey. The previous Preview was pre-CR7, and its lifecycle button payload included both action and internal notes, which the API rejected. Do not mark an E2E as passed using that stale runtime or only direct SQL calls.
- Run one unmistakably synthetic, realistic staging journey against the CR7 application changes through request, design, allocations, proposal, acceptance, finance and operations. Verify canonical ID, histories, snapshots, negative mutation guards, RBAC/PII separation and cleanup. Do not fabricate real supplier commitments or payments. The two Batch-5 partner fixtures `RC-20260916-50681C` and `RC-20260916-3760D7` must be preserved.
- Authenticated staging Super Admin could open both protected CR5 application details. The guide fixture displayed attachment metadata and review history; its synthetic test PDF rendered through a time-limited signed link. The vehicle fixture displayed its no-file state and review history. An unsigned public Storage URL returned HTTP 400. The two fixtures were not modified. Broader per-role live checks remain limited by the single staging Super Admin user; static RBAC tests are not a substitute for distinct-role sessions.
- Perform an authorised human staging admin and responsive smoke of the CR7 runtime after its publication. Do not weaken Preview protection to automate it.
- P2/future: formal amendment workflow, richer operational scheduling, supplier portal, automated notifications, final-voucher generation and incident management. These are not silently implemented by CR7.

The applied migration is the only permanent CR7 staging database change at this checkpoint. The live guard test used rollback-only fixture rows and left no CR7 staging business rows; Auth users, Storage objects, production data, and historical-stabilization resources remain unchanged. Read-only production smoke returned HTTP 200 for the holding homepage, 307 to `/` for `/journey-builder`, and 503 for `/api/enquiries`.

## Verification checkpoint and publication gate

- Final staging aggregate: 87 migrations / latest `202610010001` / CR7 migration recorded once; three CR7 triggers enabled; zero enquiries, curated journeys, proposals, acceptances, allocations, and accounts; two protected CR5 fixture applications; one Auth user; four Storage buckets and four objects.
- Exact migration SHA-256: `07b53d9d3934a692998d34578239fd2e636aeef05bc4c604c06e5d5955dea108`.
- Focused CR7/Journey tests: 34 passed. Full suite: 373 passed. TypeScript, changed-file ESLint, production build, and `git diff --check`: passed. The local build lacked Supabase environment variables and therefore cannot replace a configured staging deployment smoke.
- At the pre-publication checkpoint, the remote staging branch remained at the approved CR6 SHA `7099f29d82485ee6e8966492f2f3997122a4af0e`; CR7 application changes were uncommitted and unpublished. No persistent synthetic CR7 journey had been created. CR7-R2 expressly changed the order: commit, push, and verify protected staging Preview first, then run the synthetic E2E and guarded cleanup. Record the resulting commit, deployment and E2E evidence below before claiming CR7 PASS.
