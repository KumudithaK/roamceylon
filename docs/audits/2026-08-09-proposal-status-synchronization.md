# Proposal Status Synchronization

Date: 2026-08-09

## Repair

The proposal service already persisted `proposal_sent` to Supabase, but the parent enquiry screen retained its earlier client-side status. Journey lifecycle actions now notify the enquiry screen after a successful API response.

Admin status transitions now update immediately:

- Generate proposal → Preparing Proposal
- Mark proposal sent → Proposal Sent
- Record traveller approval → Traveller Approved

The existing database persistence and proposal-state validation remain unchanged.

## Verification

- TypeScript passed.
- Targeted ESLint passed.
- Automated tests passed: 75/75.
- Production build passed.

