# CR2 Batch 7 — public consistency and accessibility

## Audit inventory

- **P0:** Public pages inherited a global `main` landmark while many route-level surfaces already owned a `main`, producing nested primary landmarks.
- **P1:** `/editions` and `/journal` did not resolve even though both labels are part of the active public vocabulary.
- **P1:** One published Experience narrative still exposed the legacy Roam Ceylon name.
- **P1:** Unknown routes fell through to the unbranded framework not-found presentation.
- **P2:** The public footer omitted the existing Journal, Privacy and Terms destinations.
- **DEFER:** Creative refinement of the frozen wordmark, catalogue copy remediation, legal-readiness expansion and admin-interface redesign remain outside Batch 7.

## Corrections

- The root layout now provides the focusable skip-link target without claiming the page's primary landmark. Public route components own exactly one `main`.
- Stable redirects connect `/editions` to `/discover` and `/journal` to `/blog`.
- Production-managed Experience copy is presentation-normalized to the active brand without rewriting database records or compatibility identifiers.
- A branded, navigable not-found state replaces the generic framework result.
- Existing Journal, Privacy and Terms routes are exposed in the footer.

## Preserved contracts

Journey persistence keys, technical Theme identifiers, RCJ references, database schema, migrations, Storage paths, Batch 5 staging records, Batch 6 Experience exclusion/merchandising and Production Holding Mode are unchanged.
