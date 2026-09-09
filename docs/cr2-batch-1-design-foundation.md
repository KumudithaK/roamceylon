# CR2 Batch 1 — design foundation checkpoint

## Scope and baseline

- Worktree: roamceylon-commercial-staging; branch: commercial-readiness/staging.
- Starting SHA: 40ae2566840e9c828c77309841ffdc48400c760b; clean before changes.
- Dedicated Supabase link: hvcggnuptrcsxtrcjnre (browser identity/Healthy verified).
- Historical xnsxmwgyugoqanuoyebh: PAUSED, verified read-only.
- Four Vercel Preview variables remain scoped to commercial-readiness/staging. Public backend URL verified as the staging project. No environment settings changed.
- Production was not targeted. No Supabase mutations, Auth operations, Storage writes, production deployment, alias, DNS or configuration changes are part of this batch.

## Implemented foundation

Exact primary palette: forest #0B302A, gold #B58A3A, ivory #F6F1E7, sand #E8DDC8, charcoal #252522. Semantic surfaces, readable muted text, interaction/focus/border/overlay roles and independent operational error/success/warning roles.

Manrope + Playfair Display retained. Responsive display/heading scales, 14px supporting text and 12px eyebrows in changed primitives. 8px rhythm, 1280px shell, 736px reading measure, 1440px media shell. Global helpers are layered so explicit page utilities can still supply inverse presentation.

Buttons, badges, cards, section headings, labelled fields and honest loading/empty/error states use shared styling. Contact form presentation adopts field associations/input types; submission handler, validation schema, honeypot, idempotency key and payload remain unchanged. No valid form was submitted.

Header: Editions / Destinations / Experiences / Our story; primary Plan Your Journey CTA preserves /journey-builder?step=0. Supplier resources and the empty Journal are not primary navigation. Mobile/tablet uses the installed Radix Dialog for focus trapping, Escape and focus restoration; all navigation closes it.

Human-review refinement: the compact header identity now pairs the faithful approved emblem crop with the readable wordmark, without a tiny tagline or increased shell height. Partner with us uses a restrained Heritage Gold outline while Plan Your Journey remains the sole filled primary action.

Footer: approved phone, WhatsApp, Facebook and postal address are explicit verified presentation constants, not an unrestricted CMS email feed. No email, legal registration, licence or corporate claim. External contact links use noopener noreferrer. Updating these verified footer contacts later is a reviewed presentation change.

The full application inherits the cinematic editorial identity of the Coming Soon experience while evolving it into a highly usable luxury travel platform. Public surfaces may be atmospheric, image-led and Playfair-forward; functional surfaces remain clear, scannable, accessible and conversion-oriented; Admin remains operational and information-efficient. Shared `editorial-surface`, `editorial-rule` and `cinematic-image` primitives provide this capability without redesigning Batch 2 page compositions.

Shared section padding now follows controlled editorial whitespace (`3.5rem` to `6rem`) rather than the earlier `4rem` to `8rem` range. Shared section-heading relationships and listing-page introductions are correspondingly tighter; major storytelling transitions may still opt into more generous spacing deliberately.

Shared FadeIn respects reduced motion directly; standard reveal 450ms, bounded delay. Motion CSS suppresses animations/transitions for reduced motion.

The staging image allowlist adds only HTTPS hvcggnuptrcsxtrcjnre.supabase.co/storage/v1/object/public/**. Existing production-host support and security headers remain intact.

## Approved logo

Human-confirmed source: ChatGPT Image Sep 8, 2026, 04_31_37 PM.png.

The original is archived byte-for-byte under assets/brand, outside the public download directory. SHA-256:
5de54200e42d8486099ba4e085a28ba5ca66558c16b929ca3c9f5e5e433c3afa

This is a raster master, NOT a vector master. The deterministic derivative script checks the exact source hash, removes only the near-white matte with an anti-alias ramp, crops, resizes and encodes. No tracing/redrawing/recolouring/generation. See raster-provenance.json for crop bounds, dimensions and output hashes.

- Full lockup: 960 × 654 lossless WebP, 154638 bytes.
- Emblem: 218 × 320 PNG, 83438 bytes (Next/Image serves a smaller rendition).
- App icon: 64 × 64 transparent PNG, 5413 bytes.
- Footer uses the faithful emblem crop, with separate readable brand/tagline text.
- Header/compact presentation pairs the faithful emblem crop with a deliberately temporary readable HTML wordmark; dark backgrounds retain the readable HTML treatment until an approved inverse asset exists.
- Full graphical lockup component is reserved for large light-background contexts; small viewports fall back to text. Do not force it into a narrow container.
- Proper approved compact/vector/dark-background artwork remains deferred, not invented.

## Local verification

- Focused rendered/static tests cover palette, actual header/footer output, navigation contracts, mobile Dialog architecture, logo fallback/provenance, semantic feedback, labelled errors, readable controls and host scope.
- Existing rebrand, journey-persistence, security/integrity tests remain required.
- PASS: 11 focused foundation tests; 243/243 full-suite tests; TypeScript; production build; changed-source ESLint; git diff --check.
- Browser review at 1440px desktop, 768px tablet and 390px mobile: shell/forms/footer fit; no horizontal overflow; emblem has no white rectangle or distortion.
- Mobile keyboard focus loops within the menu, Escape returns focus, and Editions navigation closes the dialog at /discover.
- Empty local form validation focuses the first invalid field and links errors via aria-describedby. No enquiry request was sent.
- Local review uses no Supabase credentials; data-driven catalogue content is not fabricated. Data-backed Preview review follows publication.
- An existing unlayered anchor reset was found to override CTA text utility colour; it is now in the base layer. Desktop CTA verified ivory text on forest.

## Preserved / deferred

No changes to migrations, schema/types, API contracts, internal theme architecture, curated_journeys, RCJ references, benefit/origin codes, persistence keys, journey store/restoration, proposal snapshots, historical logo assets or audit/accounting records. No package or lockfile change.

Batch 2 public/editorial page composition, Batch 3 Journey Builder, Batch 4 Admin and Batch 5 comprehensive QA remain deferred. Catalogue-managed copy/photography, real Journal content, page-specific legacy tiny text/modal accessibility and verified mailbox provisioning are not completed in Batch 1.

## Human review gate

Persistent staging Preview:
https://roam-ceylon-git-commercial-readiness-staging-roam-ceylon.vercel.app

Do not treat an earlier deployment at this URL as the new checkpoint. Verify the new branch SHA/Preview deployment before review. The full commercial launch remains NOT LAUNCHED. CR2 remains IN PROGRESS. Batch 2 requires separate human authorization.
