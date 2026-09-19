# CR2 Batch 6 experience merchandising

The public Experience catalogue remains backed by the existing published Experience records and relationships. This correction adds a small presentation-layer configuration in `lib/experience-discovery.ts`; it does not change the schema, migrations, catalogue rows, relationship rows, URLs, or Journey Builder persistence contracts.

## Public discovery exclusion

`cricket-with-local-players` is excluded by exact stable slug through `publicExperienceExcludedSlugs`. The filter is applied to:

- the public `/experiences` catalogue;
- public related recommendations;
- homepage experience curation;
- Journey Builder bootstrap data, which also supplies public Edition and destination Experience lists; and
- the public partner-page journey preview.

The record is not deleted or unpublished. Its canonical `/experiences/cricket-with-local-players` detail route remains available for compatibility because the detail route resolves the requested record before filtering only its recommendations.

## Intentional merchandising

`experienceMerchandising` contains the exact slugs for one signature Experience and five supporting Experiences. The preferred Yala safari is the signature. Supporting entries deliberately span heritage, adventure, coast/wellbeing, local culture, and the highlands.

If a configured record is unpublished or unavailable, it is skipped. The signature falls back to the first discoverable Experience with an image, then the first discoverable Experience. Supporting gaps are filled from other discoverable Experiences with images. No completeness score, hidden ranking, or database mutation is involved.

This configuration is intentionally small and explicit. A future CMS-backed merchandising model can replace it when commercial users need to schedule or reorder features without a release.
