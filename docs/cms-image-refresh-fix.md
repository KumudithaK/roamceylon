# CMS image refresh and partner-demo poster correction

22 October 2026. Staging worktree only; no Production or database mutations.

## Confirmed causes

1. `/destinations` and `/` were build-time prerendered with `initialRevalidateSeconds: false`. Admin `ResourceEditor.save` writes directly to Supabase and does not invalidate those routes. The dynamic destination detail page could therefore show a saved new image while the static listing retained the old deployment image URL. This is not an unsuccessful upload or a separate card image field: both use `destinations.hero_image_url`.
2. The published homepage record has both `hero_background_image_url` and `hero_video_poster_url` NULL. The demo fallback explicitly selected Ella's destination image. That stale static picture remained visible until the YouTube player reached PLAYING; it was not a frame from the video.

Read-only staging evidence: Ella's public record contains the user's replacement `.../7b286d97-9302-4f62-93fa-a4c487947601-the-common-wanderer-9888.webp`, updated at 2026-10-22 08:15:21 UTC (13:45:21 Asia/Colombo). The existing persistent alias card still referenced Wikimedia `Ella_railway_station.jpg`. No admin Save, upload, delete or mutation was performed by the agent.

## Changes

- Request-render only these two CMS-backed routes with `dynamic="force-dynamic"`; do not freeze future saved images/copy into the deployment build. No revalidation endpoint, secret, grant or database change is added.
- Demo-only missing-poster fallback now uses `https://i.ytimg.com/vi/OkLsh-4NokU/maxresdefault.jpg`, verified to load at 1280×720. YouTube's own oEmbed metadata confirms the same selected film, “SRI LANKA 🇱🇰 || Cinematic Travel Film”. No video/image was downloaded into the repository, rehosted or modified.
- An intentional saved homepage poster is still respected. A failed homepage read does not accidentally reintroduce the destination fallback into the demo. Non-demo hero fallback behavior remains unchanged.
- Next Image adds only the exact HTTPS host/path above, without query parameters; no broad host wildcard or security-header relaxation.
- Existing muted playback, Pause/Play, reduced-motion/static behavior, CTA and all Ceylo functionality remain unchanged.

## Validation

Full suite **460 passed / 0 failed / 1 expected skip** (461 registered); the skip remains the intentionally absent account-date migration candidate. Changed-file ESLint, TypeScript, production build and `git diff --check` PASS. Built prerender manifest independently confirms **neither `/` nor `/destinations` remains statically prerendered**.

Actual optimized-build browser on port 4190:

- Ella card references the exact newly saved public Storage URL and renders the replacement train-and-bridge image; image loaded successfully.
- Hero image references the selected film's thumbnail, not Ella. Loaded successfully. Actual video played, then Pause gave `paused` / zero iframes with the correct static poster underneath.
- Source/controller regression coverage preserves autoplay failure, reduced-motion gating, safe CTA/iframe layering and scope/security boundaries.

Screenshots: `/private/tmp/cms-ella-card-local.png`, `/private/tmp/cms-hero-poster-local.png`. These are local evidence until deployed checks are added below. Other externally hosted catalogue images may independently show the existing “Image awaiting review” fallback; no unrelated image URL or review status was altered.

Logs: `/private/tmp/ceylo-image-fix-{full,eslint,ts,build}.log`.

## Scope / publication checkpoint

Intended correction files: `app/page.tsx`, `app/destinations/page.tsx`, `lib/partner-demo.ts`, `next.config.ts`, `tests/ceylo-hero-lifecycle.test.ts`, this document. Pre-existing local updates to R15/Ceylo reports are excluded from the correction commit.

Parent Ceylo commit `56d44688c086ced13e6cec9afe6b493820dfa666` was pushed by the human and independently reached READY at `dpl_J4AMEKLas8wqgopaq5TULwKLFkdH`, immutable URL `roam-ceylon-p5y5owxr3-roam-ceylon.vercel.app`. Its actual new mascot/panel, real Ella catalogue links and muted video were verified. The persistent alias was still manually pinned to older R15 `dpl_6TUkjrTMK46tWx6AFnuJFkf6T4ne`; do not assume a READY Git deployment automatically moved that alias.

The reviewed correction must reach READY, match its exact commit/project, remain protected, and pass card/poster/Ceylo checks before final alias verification. Use the newer verified Ceylo Preview as the rollback target if the new correction fails. No Production alias/promotion is authorized.

All `app/api`, `lib/admin`, `supabase`, package and lock files remain byte-identical to R14 security baseline. No migration or account-date candidate, RLS/grant/Auth/supplier/finance/business-row operation. The user's legitimate CMS/Storage edit is preserved, not treated as corruption or rolled back. No new claim that historic data fingerprints still match after that human edit.

Publication verification pending.
