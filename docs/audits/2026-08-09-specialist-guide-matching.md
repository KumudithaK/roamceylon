# Specialist Guide Matching

Date: 2026-08-09

## Existing model confirmed

Guide records already support reusable CMS relationships through:

- `guide_destinations` for local, area and site coverage
- `guide_themes` for genuine thematic expertise
- `guide_experiences` for specific experiences a guide is qualified or approved to lead
- `guides.nationwide` for journey-wide availability

These relationships remain separate from traveller preferences and from the final supplier allocation.

## Improvement delivered

- Clarified the Admin Guide → Coverage editor so the purpose of each mapping is explicit.
- Kept theme and experience specialist mappings editable even when a guide is available nationwide.
- Loaded saved `guide_experiences` relationships into Admin Journey Management.
- Specialist allocation shortlists now match guides by nationwide availability, destination coverage, or a selected experience at that destination.
- Matching only creates a shortlist. It does not automatically allocate or overwrite a traveller preference.

## Verification

- TypeScript passed.
- Targeted ESLint passed.
- Automated tests passed: 74/74.
- Production build passed.

