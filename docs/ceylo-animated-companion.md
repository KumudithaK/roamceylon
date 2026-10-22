# Ceylo animated companion — partner demo visual polish

22 October 2026. Protected staging only. CR7 remains HOLD. Commercial Launch is NOT AUTHORIZED.

## A. Existing launcher defects addressed

Replaced the large opaque cream capsule, permanently repeated name/subtitle and tiny circular artwork with a character-only launcher. Corrected an initial panel/navigation overlap, scrollbar-width mobile overflow and compact-layout focus restoration during visual QA.

Starting source: verified R15 `3529c93a1784963f27ee2a5abac52ec4b6611a43`, following R14 security baseline `6023e6620db6f467a056b135f41f927571a5c5d9`. Work remains isolated in `roamceylon-partner-demo-r15`; the other dirty worktrees and the pre-existing local R15 report changes are preserved, not included in this update.

## B. Floating mascot design and asset provenance

Transparent character, bottom-right: 112px desktop / 80px mobile, natural shadow, no white rectangle/capsule or permanent text label. Foreground sits above the hero; the video pause control remains on the opposite side. Safe-area-aware edge placement. Conversation header repeats a small cutout to preserve the character connection when short-screen mode hides the larger dock.

Original approved PNG is unchanged, SHA-256 `1e63796f4fae29b44eddacc8250743d10e45825a2cd4cfe647aafdf9abc8b5d6`. A built-in image-generation **background-extraction edit** produced a transparent derivative visually matched to the original central character. This is not represented as a pixel-identical extraction or a layered animation asset. Inspected full-alpha output (alpha range 0–255); mechanically resized/compressed into `public/partner-demo/ceylo-companion-cutout.webp`, 384×384, approximately 51KB, SHA-256 `399a626faaef415183c31a2632cf8851b5ac3f67a4d3544839a5dd57670a7b12`.

Final image-edit prompt:

> Use case: background-extraction. Asset type: transparent website mascot cutout. Edit target: the attached approved Ceylo artwork. Extract ONLY the central fuzzy vibrant-green Sri Lankan nature-spirit character, retaining its exact silhouette, leaf sprout, raised waving arm, huge brown eyes, smiling mouth, rosy cheeks, soft moss texture, pose and identity. Remove the off-white background, floor shadow, the four surrounding travel speech illustrations, and the yellow exclamation marks. Truly transparent alpha around the character, no white rectangle, no halo. Keep the full central character and leaf tips, centered with a small even transparent margin. Do not redesign or invent any facial expression, anatomy, accessory or character. No text, no additional objects.

Generated source remains in the normal generated-images directory; the consumable derivative is inside the repository. No unrelated character was generated.

## C. Animation implementation

CSS-only transform/opacity keyframes: gentle float, organic tilt/breathing, hover lift, attentive listening, restrained curious movement/sparkle, rhythmic speaking, brief happy bounce and subtle error tilt. No animation library/dependency, render loop, interval or layout-position animation added. An explicit Pause/Resume Ceylo animation control and `prefers-reduced-motion` override disable motion. No fake lip-sync, eye blink or leaf articulation: the available cutout is a single static raster without facial/leaf layers.

## D. Character state transitions

- READY → gentle float. Microphone permission waiting remains READY, not falsely LISTENING; its actual status text explains the permission request.
- LISTENING → attentive/pulse/waves only after recognition `onstart`.
- PROCESSING → curious movement while catalogue matching, transcript finishing or queued speech preparation is actually pending.
- SPEAKING → rhythmic movement only after utterance `onstart`, not simply a Listen click. Completion/error/cancel/close return to idle or the explicit error state; stale completion/start/error events cannot revive completed speech.
- SUCCESS → one short bounce on opening or completing a catalogue response.
- ERROR → restrained movement plus readable alert text; no fabricated facial expression.

## E. Speech bubble behaviour

Exact welcome: “Hi! I'm Ceylo 🌿 / Where shall we explore?” Warm ivory/forest text, pointer and small shadow. Dismissible, disappears after nine seconds or opening Ceylo, never reopens on a timer. A bounded, event-driven placement check keeps it hidden until measured and permanently dismisses that session's hint if it intersects a hero headline, CTA or video control. Actual 320×568 final-build check confirmed no hint remains over the CTA. Module-memory dismissal survives client-side homepage returns; a full document reload starts a new page session. No cookies, browser storage, notifications or identity tracking.

## F. Voice and recommendation functionality preserved

Same English recognition, visible editable transcript, manual Send, opt-in synthesis, Stop Listening, Stop Speaking, voice/text switching, permission/unsupported fallback, timeout/generation protections and unmount cleanup. No automatic microphone or speech on load, audio recording or transcript persistence. Starting recognition cancels synthesis; speaking cancels recognition. Queued speech can also be stopped.

Heading/subtitle and five suggested questions match the redesign brief. The catalogue recommendation engine, server public-only projection, actual destination/Experience links and Journey Builder integration remain unchanged. Guided-demo disclosure and no-price/no-inventory/no-booking/privacy boundaries remain explicit.

## G. Browser results

Actual in-app browser, local dev 4187 and optimized production-mode builds 4188/4189 (4189 is the final fresh process), staging public catalogue only (no service-role credential):

- Transparent character rendered without a white rectangle, hero played the existing selected video muted, and both motion/video controls stayed reachable.
- Desktop 1280×720 checked. Panel repositioned below fixed navigation, and open/close worked with the new editorial heading.
- Mobile 390×844: settled panel x14/y100, width347/height624 within the actual scrollbar-reduced layout viewport; character 80px. Main CTA/navigation remain usable with the panel closed.
- Compact 320×568: panel x14/y12, width277/height544; Send 44×44 at y402. Landscape 844×390: panel width430/height366, Send visible. On very short screens the larger dock is hidden while the header cutout keeps Ceylo visible.
- Enter opens, textarea receives focus, Escape closes and restores focus to the now-visible launcher, including short-screen mode. Nonmodal panel does not trap the visitor.
- Real Ella suggestions returned Ella Rock, Nine Arches and Diyaluma public Experience links and a real UUID Journey Builder URL. December beach query returned only real catalogue records with seasonal caveats.
- Actual browser speech entered `speaking` character state; Stop Speaking returned to ready. Permission-waiting microphone request was cancelled cleanly using Stop Listening; text entry recovered. No permission was granted or audio submitted; actual spoken-word transcription remains unverified.
- Manual animation pause produced computed `animation-name: none` without stopping the hero. System reduced-motion CSS and hero provider gating have automated coverage; actual OS preference emulation was not available, so no live reduced-motion session is claimed.

Final optimized-build screenshots and deployed checks are recorded below when complete.

## H. Performance and accessibility

Explicit dimensions, bounded fixed overlay and transform-only motion avoid document layout shifts. Single small static WebP, CSS motion, no new packages, heavy player or sprite runtime. Existing conversation code remains bounded rather than adding a separate lazy loader and state-reconstruction complexity. Labelled mascot, aria-expanded/controls, visible focus ring, keyboard return, live status/alerts, readable transcript and mostly 44px controls. Native browser voice support, voices and external provider processing vary and remain disclosed. No formal assistive-technology certification, field performance benchmark or human audio-quality evaluation is claimed.

## I. Intended files

- `components/ceylo/ceylo-companion.tsx`
- `components/ceylo/ceylo.module.css`
- `lib/ceylo/companion-state.ts`
- `lib/ceylo/catalogue.ts` (suggested question strings only)
- `lib/ceylo/voice.ts`
- `public/partner-demo/ceylo-companion-cutout.webp`
- `tests/ceylo-companion.test.ts`
- `tests/ceylo-demo.test.ts`
- this report

No `app/api`, `lib/admin`, `supabase`, package/lockfile, hero, recommendation engine, server catalogue projection or security-header change. Original R15 report modifications are pre-existing and excluded from the intended commit.

## J. Tests/build

Final full suite: **459 passed / 0 failed / 1 expected skip**, 460 registered. **33 focused Ceylo/hero tests pass.** The expected skip is the deliberately excluded pending account-date candidate hash test. Focused coverage includes the new state, one-shot hint/collision guard, voice-start/completion guard, launcher/focus, requested questions, motion and existing recommendation/confidentiality regressions. TypeScript, changed-file ESLint, scoped production build and `git diff --check` PASS.

Logs: `/private/tmp/ceylo-animated-{full,focused,ts,eslint,build}.log`. Build used only normal staging public URL/key with service-role blank. R14 allocation API/security files and migrations byte-identical; security migration hash remains `23625b5e855bd7b539e8b44f2fcf2bd1f5a34f27d834efaf494540c9f2466c1d`; account-date migration absent. Only existing public catalogue reads were performed: no SQL or data-mutating request, migration, new Auth user, business record, grant or RLS change. No new live distinct-role JWT testing is claimed.

## K. Publication and rollback target

Before publication, the authoritative Get Alias result mapped the staging alias to **`dpl_6TUkjrTMK46tWx6AFnuJFkf6T4ne`**, the newer verified R15 `3529c93…`, not the older R14 deployment. Its immutable URL is `https://roam-ceylon-fu5adaiqf-roam-ceylon.vercel.app/`. This is the rollback target for this visual update.

Human refreshed normal Vercel CLI authentication after missing-credentials/deployment-access errors. Fresh project metadata confirms exact project `prj_1UyIsBoedY2TF9rhHZhfywZ61pp0`, Authentication `all_except_custom_domains`, both demo switches restricted to Preview branch `commercial-readiness/staging`, and Production branch still `release/production-20260820`.

Fresh normal Preview configuration pull confirmed existing project binding and exact staging Supabase public URL, the two non-secret demo flags and a public key present. The unexportable service-role placeholder is never used for publication: Git-based Preview builds retain the existing remote secret in place. Publication pending source allowlist checks. No Production operation is authorized.

## L. Staging alias verification

Target: https://roam-ceylon-git-commercial-readiness-staging-roam-ceylon.vercel.app/

Pending new protected Preview deployment. Verify READY, exact intended source commit, authoritative alias→deployment mapping, staging Supabase project, Vercel SSO redirects without bypass, new character/cutout, actual catalogue links/voice-stop/CTA and muted hero. Restore the newer verified R15 target above if a rollout check fails.

## M. Limitations and scope

Single-raster whole-character animation, not articulated facial/leaf animation. Guided deterministic catalogue companion, not a live LLM or booking agent. Browser speech recognition/transcription still needs an explicitly consented human supported-browser check. Provider autoplay/branding/voice availability remain external limitations. Reduced-motion is covered in code tests, not a live OS session.

No Production/historical-stabilization, database, RLS/grant, Auth, finance, supplier or business-data changes. No account-date candidate, unrelated CR7 remediation, CR8/CR9 or launch authorization.

Status pending controlled staging publication.
