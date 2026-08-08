# Traveller Enquiry, Proposal and Accounting Review

Date: 2026-08-08

## Executive finding

No evidence was found that existing traveller enquiries or accounting transactions have been deleted or overwritten. However, the recently introduced supplier-allocation workflow mixes quotation preparation, supplier operations and accounting concerns in one editor. The workflow is therefore confusing and is not yet a safe representation of how a DMC prepares a proposal.

## Why the proposal reports six missing allocations

For a journey containing Sigiriya and Anuradhapura with one selected experience, the current scope generator requires:

- two accommodation allocations (one for each destination);
- two guide allocations (one for each destination);
- one vehicle allocation (Sigiriya to Anuradhapura); and
- one experience-provider allocation.

This totals six allocations.

The accommodation dropdown currently updates only a browser-side draft. Proposal generation reads saved `journey_supplier_allocations` records from Supabase. Until **Save allocations** is used, even the visibly selected hotel is counted as missing. The error does not identify individual missing allocations or warn that the screen contains unsaved changes.

The required-scope model is also too simplistic:

- it requires accommodation at every destination even when the itinerary may not include an overnight stay;
- it creates a guide allocation per destination, including for a National Tourist Guide who would normally cover the whole journey; and
- it requires a manually named provider for every experience.

## Commercial and operations details

The fields currently mean:

- **Supplier cost:** Roam Ceylon's internal buy cost for that service.
- **Selling price:** the traveller-facing amount contributed by that service.
- **Supplier contact:** the operational contact used to arrange the service.
- **Confirmation:** whether the supplier has confirmed availability.
- **Invoice:** whether a supplier invoice has been requested or received.
- **Payment:** the supplier-payment state.
- **Arrival instructions / special notes:** delivery notes for the operations team.

These fields are individually useful, but they should not all appear in one pre-proposal disclosure. Supplier/rate selection belongs to proposal preparation. Invoice, payment and detailed arrival instructions belong mainly to post-acceptance operations and accounting.

## Missing hotel-rate relationship

The hotel editor correctly stores multiple plans in `pricing_plans`, including BB, HB and FB-style rates. The new `journey_supplier_allocations` table stores only `accommodation_id`, manually entered `supplier_cost` and manually entered `selling_price`.

It does **not** currently store:

- selected pricing plan / meal basis;
- room type;
- number of rooms;
- guest occupancy;
- check-in and check-out dates;
- number of nights;
- unit rate; or
- a rate snapshot protecting a sent proposal from later catalogue changes.

Consequently, selecting Water Garden Sigiriya does not allow the administrator to choose BB, HB or FB and cannot calculate the accommodation line reliably from the hotel's own data.

## Enquiry and accounting boundary

The intended lifecycle should remain:

1. Traveller enquiry records traveller intent.
2. Internal allocation records proposed suppliers and services.
3. A versioned proposal snapshots the selected services, quantities and selling prices.
4. Traveller accepts the proposal.
5. A deposit is actually received.
6. Accounting is activated and supplier obligations are created.

The current implementation partially follows this model, but `syncAllocationAccounting()` may create an inactive `pending_deposit` `journey_accounts` row as soon as complete allocation prices are saved. It can also synchronise allocation changes into an allocation-backed account. This is earlier and more tightly coupled than the Accounting UI's stated deposit-activated model.

Legacy accounts are protected from this synchronisation unless their snapshot source is `supplier_allocations`, but the new allocation-backed lifecycle still needs correction.

## Recommended minimal correction

The existing enquiry, supplier databases, pricing plans, proposals and accounting records should be preserved. Do not rebuild the modules.

1. Add an explicit proposal-draft service line for each actual requirement.
2. For accommodation, select a saved hotel rate (BB/HB/FB etc.), rooms, occupancy and nights. Snapshot its description, charging basis, currency and unit rate.
3. Apply the same pattern to vehicle rental plans, guide service rates and experience ticket types.
4. Scope National/Chauffeur guides at journey level; use destination-level allocation only for area, site, wildlife or specialist guides.
5. Require stays only for destinations with allocated nights.
6. Replace the generic missing-count error with a named readiness checklist and an unsaved-changes warning.
7. Keep pre-proposal fields focused on supplier, rate, quantity, availability and selling price.
8. Move invoice, payment and detailed delivery controls into post-acceptance Operations/Accounting views.
9. Do not create or activate a journey accounting account until an actual traveller payment is recorded. Before that point, retain only proposal/commercial draft data.
10. Freeze proposal versions using complete rate and quantity snapshots so later supplier-rate changes do not rewrite sent proposals.

## Risk assessment

- **Existing data loss:** no evidence found.
- **Proposal accuracy:** high risk until rate plans and quantities are captured.
- **Allocation usability:** high risk due to invisible unsaved state and unnamed missing requirements.
- **Accounting lifecycle:** medium-to-high risk because draft commercial changes are coupled to pre-deposit account records.
- **Legacy journeys:** lower risk because legacy quote-backed accounts are explicitly excluded from allocation synchronisation.

No functional or schema changes were made during this review.
