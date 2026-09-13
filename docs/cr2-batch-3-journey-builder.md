# CR2 Batch 3 — Journey Builder

## Baseline and architecture

The public route is `app/journey-builder/page.tsx`. It is a dynamic server component which obtains the published Journey bootstrap catalogue through `JourneyService` and passes query-derived launch selections to the client-side `JourneyBuilder`.

`JourneyProvider` owns a seven-step reducer state. The flow covers Editions, destinations, experiences, per-destination stay/specialist preferences, primary-guide and language preferences, journey endpoints and dates, travellers, route transport, pace, budget posture, accessibility notes, insights and review. Catalogue dependency validation removes selections which are no longer valid after an upstream Edition or destination changes.

The versioned `roam-ceylon-journey-v3` local-storage document is authoritative for browser recovery. Launch query parameters can merge once into saved state and are then removed from the visible URL. `pageshow`, refresh and visibility restoration preserve the latest persisted step and selections. Legacy `roam-ceylon-journey-v2`, `roam-ceylon-quotation-handoff-v1` and partner-draft contracts were not renamed or modified.

No server record is created while browsing, selecting, revising, estimating or exporting the local PDF. The only customer-write boundary is the quotation form POST to `/api/enquiries`. It retains its UUID idempotency key, honeypot, bounded schema, rate limit, replay detection, persisted quotation handoff and server-generated `RCJ-*` database reference. The redesign now presents the actual reference returned by that existing endpoint.

## Baseline behaviour

Before presentation work, reducer, persistence, selection, journey-insight, estimate and enquiry-contract tests established progression, back navigation, selection/deselection, dependency validation, required journey-detail validation, optional preferences, review data, deep-link launch, refresh and visibility recovery. No staging enquiry or other business record was created.

## Visual and interaction architecture

The redesign adds reusable `JourneyOpening`, `JourneyProgress`, `JourneyChapter` and `JourneyNavigation` primitives. The experience opens with a restrained photographic editorial introduction and frames the seven technical steps as the emotional sequence Inspire, Choose, Shape, Refine and Share.

The progress rail retains chapter position, completion and backward access with native buttons, `aria-current`, visible numbers/checks and a screen-reader live description. Edition and destination choices remain native multi-select buttons with `aria-pressed`; they use catalogue imagery, explicit Select/Selected labels and non-colour selected states. Editions use an asymmetric editorial composition while destination and experience discovery remain efficient to scan.

Practical stages intentionally use quieter surfaces rather than decorative photography. The review and persistent summary are presented as “Your Ceylon Edition”, grouping the actual saved choices without inventing itinerary content. Back and Continue remain conventional, and the mobile action row stays reachable without obscuring the page.

## Responsive, accessibility and performance

The layout is intentionally single-column on mobile, two-column where useful on tablet, and content-plus-summary on large screens. Choice imagery uses responsive Next.js `Image` sizing and no hidden full-resolution duplicate catalogues were added. The progress rail scrolls within its own region instead of widening the page.

Semantic landmarks and headings, native fields, native selection buttons, `aria-pressed`, `aria-current`, dialog labelling, visible focus styling, minimum control sizes, text selection labels, alerts and screen-reader progress are retained or improved. Existing global reduced-motion handling applies to the restrained chapter and selection transitions.

## Persistence and submission verification

The reducer shape, normalisation, dependency validation, saved-state version/key, launch-query semantics and restoration helper are unchanged. Focused persistence coverage verifies fresh state, an intentional `?step=0` launch, visibility restoration after later progress, complete selection/preference survival and normal refresh recovery.

The enquiry API schema and database mapping are unchanged. The quotation UI still prevents ambiguous double submission with a stable client submission key. Success copy no longer makes a response-time promise and displays only the reference returned by the server. Final live submission remains outside Batch 3 automated verification to avoid creating staging business data.

## Visual verification and boundaries

Representative opening, selection, practical, insight and review states are checked locally at desktop, tablet and approximately 390px mobile widths. The staging Preview remains the human visual and interaction acceptance surface.

Admin, Journey Studio, database schema, migrations, Supabase configuration, pricing semantics, catalogue facts, Production and historical stabilization are outside this batch and unchanged. The compact wordmark optical-alignment observation remains deferred to CR2 final visual polish.

## Known limitations

- A fully successful live enquiry cannot be exercised without creating a staging record; automated contract evidence is used until a separately authorized controlled-write test.
- Catalogue image focal points are inherited from existing records; final aesthetic crop acceptance remains a human decision on the deployed Preview.
