# CR5 supplier and accommodation network readiness

This is a staging-only audit of Supabase project `hvcggnuptrcsxtrcjnre`,
observed on 23 September 2026. It is not a supplier register, a contract, a
licensing opinion, or authority to publish or allocate any supplier. Production
project `fstpfqlgypvktjwdeagu` and historical project
`xnsxmwgyugoqanuoyebh` were not changed.

## Decision

The application is structurally ready to receive, review and convert real
Accommodation, Transport and Guide applications, but the staging catalogue does
not currently contain any verified commercial supplier capability. Controlled
launch therefore depends on founder-led acquisition and due diligence, not on
promoting the current sample records.

## Staging inventory and classification

| Area | Total | Verified real | Classification | Commercial interpretation |
| --- | ---: | ---: | --- | --- |
| Accommodations | 10 | 0 | DEMO / SEED | All ten are `draft`, `active=true`, `verified=false`, `is_sample=true`, have no onboarding provenance and no nightly rate. |
| Vehicles | 10 | 0 | DEMO / SEED | All ten are `draft`, `active=true`, `verified=false`, `is_sample=true`, have no onboarding provenance and no daily/per-km rate. |
| Guides | 6 | 0 | DEMO / SEED | All six are `draft`, `active=true`, `verified=false`, `is_sample=true`, lack licence numbers, rates and onboarding provenance. |
| Partner applications | 4 | 0 | SYNTHETIC TEST | All four are clearly marked or evidentially synthetic, remain `submitted`, and have no decision snapshot or converted catalogue IDs. |
| Pricing plans | 0 | 0 | EMPTY | No reusable supplier-side catalogue rate exists. |
| Legacy supplier costs | 0 | 0 | EMPTY | No confidential supplier net cost exists. |
| Journey supplier allocations | 0 | 0 | EMPTY | No supplier is allocated to a journey. |

The public supplier projections return zero rows for accommodations, vehicles
and guides. The sample records are therefore not being presented as public or
bookable supply.

### Preserved synthetic applications

| Reference | Type | Files | History | State | Classification |
| --- | --- | ---: | ---: | --- | --- |
| `RC-20260916-50681C` | Vehicle | 0 | 1 | Submitted, unreviewed, unconverted | CR2 Batch 5 synthetic test |
| `RC-20260916-3760D7` | Guide | 2 | 1 | Submitted, unreviewed, unconverted | CR2 Batch 5 synthetic test |
| `RC-20260916-134303` | Accommodation | 2 | 1 | Submitted, unreviewed, unconverted | Earlier synthetic/form test; content is explicitly test/gibberish |
| `RC-20260916-A5A1AC` | Guide | 0 | 1 | Submitted, unreviewed, unconverted | Earlier synthetic/form test; content is gibberish/test input |

All four records and all four attached objects were left unchanged. The two CR2
Batch 5 applications remain the authoritative fixtures for later human admin
review. None may be approved, rejected, converted or deleted as part of CR5.

## Existing supplier-system architecture

- Public applications accept only Accommodation, Vehicle or Guide categories.
  The server validates bounded form data, derives an idempotent submission hash,
  rejects authoritative fields, checks file signatures and cleans up partial
  uploads on failure.
- Application lifecycle is `submitted` -> `under_review` ->
  `needs_information` / `approved` / `rejected`, followed by an explicit
  `converted` state. Review commands are capability-checked, idempotent and
  audited.
- Conversion is allowed only from `approved`. It atomically creates inactive,
  draft, unverified catalogue rows and records immutable
  `onboarding_application_id` provenance. It never publishes a supplier.
- Public supplier projections publish only eligible public fields. Private
  contacts, licence data and rates remain on protected base tables.
- Partner evidence uses the private `partner-application-media` and
  `partner-application-documents` buckets. Both buckets are `public=false`;
  their four current objects are marked private and staff access requires
  `suppliers.manage`.
- Reusable confidential `pricing_plans` support accommodation, vehicle, guide
  and experience charging methods, quantities, seasonal rules and notes.
- `journey_supplier_allocations` supports accommodation, vehicle, guide and
  experience service lines with guarded custom or catalogue rates, lifecycle
  history, confirmation, fulfilment and finance relationships.
- Allocation validation checks that the resource belongs to the current journey
  requirement and that an application-backed supplier came from a converted
  application.

## Model readiness and gaps

### Accommodation

The catalogue can hold property identity, destination, category, star rating,
traveller copy, imagery, address, amenities, contacts, verification, status,
onboarding provenance and pricing plans. It does not have first-class structured
fields for room inventory, occupancy by room, meal basis, check-in/out, child
policy, cancellation terms, taxes/service charge treatment, blackout dates,
rate validity, availability notes or internal contract notes. Some of these can
temporarily live in pricing-plan `details`, `seasonal_rules` and `notes`, but a
future structured contract/rate model should be designed before supplier volume
grows. CR5 does not improvise that migration.

### Transport

The catalogue supports category/model, capacities, air conditioning, driver
inclusion, provider, contacts, nationwide or destination coverage, imagery,
status, verification, provenance, per-day/per-trip/per-transfer/per-km pricing
and allocation. Registration, fleet-unit identity, insurance evidence, licence
evidence, maintenance/safety review, operating limitations, emergency contact
and contract validity are not first-class structured operational records.

### Guides

The catalogue supports biography, languages, years of experience, specialities,
licence number, contacts, nationwide/destination/Edition/Experience mappings,
verification, status, provenance and daily/half-day/full-day/multi-day rates.
Availability, credential validity/expiry, association evidence, emergency
contact, contractual terms and document linkage are not first-class structured
operational records. Current sample-guide links cover 23 destinations and 15
Edition relationships, but there are zero Experience-specialist links and none
of the six guides is real or verified.

### Experience providers

The allocation model can cost and allocate an Experience record, including a
guarded custom-journey rate, but there is no distinct Experience-provider
onboarding entity or provider-to-Experience relationship. That is adequate only
while a founder manually validates each provider and records the contracted
service in the journey allocation. It is not sufficient for a scalable
multi-provider marketplace. A future design may need an operator/service entity,
documents and provider-to-Experience capabilities; this is a schema proposal,
not a CR5 migration.

## Traveller stay preference

Journey Builder correctly captures a stay category/preference and planned nights
per destination. It resets legacy direct supplier selections during
normalisation and does not require the traveller to choose an internal property.
Actual stay selection remains an internal Journey Studio allocation decision.
No redesign is required.

## Status and operational meaning

Application status and catalogue status are deliberately separate:

1. A prospective supplier submits an application (`submitted`).
2. Authorised staff review, request information, approve or reject it.
3. Approved evidence is snapshotted and immutable.
4. Explicit conversion creates an inactive, draft, unverified catalogue record.
5. Staff complete due diligence, content, coverage and rates before independently
   marking a catalogue record verified/active/published.
6. Journey allocation then has its own pending/confirmed/cancelled, fulfilment
   and finance lifecycle.

This provides the required distinctions without adding cosmetic `prospect` or
`suspended` statuses. The unresolved operational policy is who may mark a
supplier verified and what documentary checklist must be complete first.

## Security findings

- Both partner buckets are private and contain two objects each.
- Application rows, file metadata, review history and signed object access are
  limited to `suppliers.manage` after the onboarding integrity migration.
- Public APIs cannot enumerate protected base tables or private file metadata.
- Signed previews are created only inside the authenticated admin review screen
  and expire after 900 seconds.
- Submission MIME allow-lists, signature checks, file-count limits, 3 MB
  per-file limits and a 4 MB request boundary remain in place.
- No public-bucket or anonymous supplier-contact leak was found.

## Admin usability

The source provides searchable/filterable application inbox, application type,
reference, status, date and file counts; a review view exposes submitted fields,
private attachments, notes and append-only history; guarded actions support
review and conversion; resource editors expose content, coverage, imagery and
rates.

The active automated browser session reached the expected fail-closed
`Restricted workspace` boundary even though staging contains one Super Admin
assignment and the role has `suppliers.manage`. That browser session cannot be
used as human evidence of the application detail/attachment UI. A human Super
Admin smoke of the two preserved Batch 5 records remains required; no RBAC or
session state was changed to bypass the restriction.

## Schema-change proposals (not implemented)

1. Design a supplier agreement/evidence layer for insurance, credentials,
   validity, cancellation/payment terms and private documents, linked to a
   supplier catalogue entity and review decision.
2. Design structured accommodation room/rate contracts if pricing-plan JSON and
   notes become insufficient for real property agreements.
3. Design a first-class Experience operator/service relationship before the
   catalogue needs multiple providers per Experience or automated availability.
4. Define an explicit supplier verification checklist and authorised transition
   rather than relying on an unrecorded staff convention.

These changes touch schema, operational policy and private evidence retention;
they require a separate reviewed migration programme.

## Production integrity

Read-only browser verification confirmed that `https://theceylonedition.com/`
still serves the pre-launch holding page and that `/destinations` returns to the
holding root. No production deployment, custom-domain, Supabase, Storage, Auth,
DNS or environment change was made.
