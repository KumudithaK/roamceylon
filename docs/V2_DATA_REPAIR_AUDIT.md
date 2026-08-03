# Roam Ceylon v2 data repair audit

## Executive summary

The public application and `.env.local` point at the same Supabase project. The versioned schema contains the expected content, marketplace, homepage, enquiry and relationship tables. The live anonymous audit found a systemic authorization failure: every public content query returned PostgreSQL `42501` (`permission denied for function has_role`), while `website_settings` remained readable. The public RLS policies call `private.has_role`, but the function was executable only by `authenticated`; PostgreSQL still evaluates that expression for anonymous requests.

Migration `202607260005_v2_data_relationship_repair.sql` grants the minimum function execution needed for public policy evaluation, adds normalized vehicle destinations, guide nationwide coverage, and the complete homepage hero media model. Apply it before acceptance testing:

```bash
npx supabase db push
```

## Application audit

- Next.js App Router is active. Public routes cover home, discovery, destinations, experiences, hotels, vehicles, guides, journey builder, contact, and partner registration.
- The old single-file implementation is archived and is not the active runtime.
- The previous `lib/data.ts` path silently substituted local JSON after any Supabase error. This masked RLS and relationship faults as apparently valid content.
- The repaired builder reads through typed repositories and one `JourneyService`; it no longer performs direct component-level relationship queries.
- Browser and server Supabase clients now use the checked-in `Database` type. Regenerate this file from the linked project after applying migrations when CLI access is available.

## Schema and relationship audit

| Flow | Source | Relationship | Target | Status |
| --- | --- | --- | --- | --- |
| Theme → destination | `themes` | `theme_destinations` | `destinations` | Explicit UUID joins; union/dedup in memory |
| Destination → experience | `destinations` | `experience_destinations` | `experiences` | Explicit UUID joins; union/dedup in memory |
| Destination → stay | `destinations` | `accommodations.destination_id` | `accommodations` | Direct FK |
| Journey → vehicle | journey state | nationwide or `vehicle_destinations` | `vehicles` | Normalized join added; legacy JSON read adapter retained |
| Journey → guide | journey selections | three guide join tables or `nationwide` | `guides` | Relevance-ranked |

Primary keys prevent duplicate relationship rows. Foreign keys cascade when parent content is removed. Published marketplace queries explicitly exclude `is_sample=true`.

## RLS findings

- Public content policies expose only `status='published' AND active=true`.
- Staff mutation policies use admin/editor roles.
- Public enquiries allow insert only.
- Marketplace records must additionally be non-sample before rendering.
- The anonymous `has_role` execution grant is safe because the function returns false without an authenticated `auth.uid()`; it does not grant table mutation privileges.

## Journey state

One reducer-backed store persists as `roam-ceylon-journey-v2`. It stores selected theme, destination, experience, stay, vehicle and guide IDs plus dates, travellers and budget. Changing an upstream selection prunes invalid downstream destinations, experiences and stays.

## Hero media

Homepage media supports desktop MP4/WebM, mobile MP4/WebM, poster, overlay strength, enable/autoplay/loop/mute flags and an image fallback. Files belong in `travel-content/homepage/hero/`. The shipped configuration remains poster-first and contains no YouTube embed or unlicensed video.

## Remaining operational checks

After pushing migrations, use an incognito browser and the admin diagnostics screen to confirm:

1. anonymous published reads return 200;
2. drafts and inactive records remain hidden;
3. each published destination has a theme;
4. each published experience has a destination;
5. marketplace samples remain absent;
6. hero poster/video URLs resolve from the storage bucket.
