# Partner demo R15 — controlled staging publication checkpoint

21 October 2026. Staging only. CR7 remains HOLD. Commercial Launch remains NOT AUTHORIZED.

## A. Starting baseline and isolation

Worktree: `roamceylon-partner-demo-r15`, detached from verified security commit `6023e6620db6f467a056b135f41f927571a5c5d9`. The original dirty commercial-readiness worktree and isolated R14 worktree were preserved. Remote `commercial-readiness/staging` still points to that exact commit.

The existing Vercel deployment was independently viewed as **Ready / Preview**, source `6023e66`, deployment `dpl_6zJxMvDiHhbZT4JqV1WEH6AxFcmi`, with the intended persistent staging alias assigned. No R15 deployment is claimed.

A fresh PostgreSQL-native SELECT audit on backend **270378** against project **hvcggnuptrcsxtrcjnre** returned:

- 89 migrations; latest `202610150002`; security migration recorded once; account-date `202610150001` absent.
- All 59 non-migration table fingerprints / all 53 public-table fingerprints MATCH the captured R14 baseline, including protected CR5 records and empty CR7 business/history tables.
- All 12 catalog groups MATCH, including functions, constraints, triggers, policies, grants outside the two approved targets, namespace/default ACLs and role settings. The exact two-target ACL list matches the installed security boundary: only the previously approved authenticated SELECT removals, no additions.
- Suppliers 10 accommodations / 6 guides / 10 vehicles; pricing plans 0; original pricing NULLs 13.
- Auth 1 user / 1 Super Admin; Storage 4 buckets / 4 objects. Their canonical row digests also match, not merely counts.
- Account sequence 2, is_called=true; all four cleanup hooks null; zero other idle client transactions.

Method: existing R13/R14 canonical server-side `to_jsonb(row)::text` row digests, sorted aggregate digests and native `pg_get_functiondef`/catalog digests. No dashboard-rendered function text was hashed. This task ran SELECT-only baseline verification; no migration, grant, RLS, Auth or business mutation was executed.

Independent final comparison on fresh backend **271099** returned the same complete MATCH results, 89/latest002/account-date0, unchanged Auth/Storage/supplier/pricing/sequence values, inactive hooks and zero open idle client transactions. Temporary audit browser tabs were closed afterward.

On resumption, fresh pre-publication backend **272530** again returned the same complete MATCH results. Only public catalogue reads were used for the configured local browser checks below; no synthetic record was created.

All security runtime files, all migration files, package.json and lockfile are byte-for-byte unchanged against the verified source. Security migration SHA remains `23625b5e855bd7b539e8b44f2fcf2bd1f5a34f27d834efaf494540c9f2466c1d`. The separate account-date candidate is not present in this checkout. Migration file inventory remains 89.

## B. Cinematic hero

Reuses the existing integration with the official privacy-enhanced YouTube iframe and IFrame Player API. Video `OkLsh-4NokU`; autoplay/mute/loop/playlist/playsinline parameters; muted readiness; no soundtrack/unmute feature. No video was downloaded, edited or rehosted; no dependency was added.

Responsive 16:9 cover framing, forest gradient, exact approved headline/subheading, existing Plan Your Journey route, pointer-events:none, decorative iframe excluded from keyboard/accessibility interaction, stable hero dimensions, static image always underneath. Pause removes the iframe. API error, autoplay rejection, loading/stall watchdog and reduced motion retain the poster. Reduced motion prevents provider initialization. Provider branding/initial overlays and browser autoplay limitations remain outside our control.

Enablement requires both `CEYLON_PARTNER_DEMO_HERO=1` and `CEYLON_DEMO_SCOPE=commercial-readiness-staging`. Local development is allowed. Vercel additionally requires Preview, branch `commercial-readiness/staging` and the exact staging Supabase URL. Production is always denied; there is no URL/query switch. Demo homepage alone allows same-origin microphone permission requests; all other documents retain the original microphone denial. Camera/geolocation and all unrelated security headers remain unchanged. Homepage is noindex in scoped demo builds.

## C. Approved mascot

Exact original approved PNG copied without editing to `public/partner-demo/ceylo-approved.png`, 1254×1254. SHA-256 `1e63796f4fae29b44eddacc8250743d10e45825a2cd4cfe647aafdf9abc8b5d6`. No generated/substitute mascot or modified asset. UI shows the full artwork using contain sizing.

## D. Recommendation mechanism

No approved AI service was found. The interface is accurately labelled **Guided catalogue demo**, not a live LLM. Deterministic bounded matching supports the six requested example interests, place-specific Ella requests, month/day/family/honeymoon context and clarifying questions.

`lib/ceylo/catalogue-server.ts` uses only the existing publishable client and explicit public columns from published/active destinations, Experiences and their public linking table. It never calls an admin client, private table, supplier/pricing table or RPC. Coming-soon destinations, the existing seven discovery-held Experience slugs and orphan relationships are excluded; approved public-copy corrections are reused.

Only an explicit customer-safe DTO reaches the browser. Recommendations generate destination/Experience URLs from included records and Journey Builder parameters from their real UUIDs. No invented catalogue entries. Unknown/private/price/booking requests and unavailable catalogue return honest bounded responses. Seasonal suggestions are qualified, with an official Sri Lanka Tourism source; no live weather, swimming safety, wildlife sighting, price or inventory guarantee.

Chat matching is local to the browser: no paid AI, transcript endpoint, analytics, recording, localStorage or persistent chat store. Input <=600 characters; answer <=2400; last eight exchanges held only in component memory. No new enquiry or booking submission is made by Ceylo.

## E. English voice

Native SpeechRecognition/webkitSpeechRecognition and speechSynthesis where available. Mic activation is only on a button click. Interim/final transcript appears in the editable question box; user stops/reviews/edits/sends it through the same recommendation function as typed text. No automatic transcript submission.

Speak replies starts OFF. An explicit Listen to this reply click or opt-in Speak replies control initiates speech of the exact visible answer text. Available English system/browser voices are selected; no accent promised. Mic start cancels speech; speech cancels recognition. Stop controls, close/Escape, unmount cleanup, generation guards, timeouts and error recovery prevent stale events, duplicate sends and feedback loops. Browser/provider remote processing and limitations are disclosed in Voice & privacy. No audio recording is stored by this application.

Reference: [MDN Web Speech guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API). Support/provider behavior varies by browser.

## F. Actual browser evidence — local, not deployed

Tested the isolated server at `http://127.0.0.1:4185/`, not the earlier 4180 worktree.

- Real YouTube embed reached `data-hero-video-state=playing` with the exact selected video and mute=1; iframe/frame pointer-events both none. Pause changed to paused and iframe count 0. Resume worked. This confirms embedding worked in the tested browser, not universal provider availability.
- Desktop Ceylo open/close, greeting, exact mascot and guided label; Escape closed the panel and restored focus to the launcher.
- Mobile 390×844 reviewed visually; corrected compact 320×568 panel within viewport (x12/y12, width281/height544); landscape 844×390 panel within viewport (width460/height366), Send visible. Width uses the actual layout viewport rather than scrollbar-inclusive vw. Video pause is on the left so the right-side launcher does not cover it.
- Suggestion click produced the honest catalogue-unavailable response in the credential-free local checkout. No live recommendation success is claimed from this local state.
- Actual browser speech synthesis entered Speaking, completed, and a separate run was explicitly interrupted by Stop Speaking back to idle. Audible quality/accent was not evaluated by a human.
- Ceylo CTA navigated to the existing Journey Builder; no form was submitted. Ceylo unmounted there.
- Local HTTP: homepage 200 with microphone=(self); unauthenticated allocation API 401 with microphone=().

After normal staging Preview configuration was pulled, a production-mode local build on **4186** used only the verified staging publishable URL/key, with the service-role key deliberately blank. The real public catalogue loaded. Actual browser family-beach recommendations returned Ahungalla, Arugam Bay and Kalpitiya; a December follow-up returned Ahungalla, Kalpitiya and Tangalle with seasonal/sea-safety caveats. Ella returned the real Ella Rock, Nine Arches and Diyaluma Experience links. Ahungalla and Nine Arches links were clicked and their correct published detail pages loaded. This is real staging-catalogue/browser evidence, still not deployed R15 evidence.

A focused refinement avoids asking again for a month/duration already supplied. Actual microphone permission/transcription and provider-blocking/reduced-motion browser emulation remain unverified. Lifecycle/provider failures and motion behavior were tested with controlled unit doubles; those results are not live microphone evidence.

## G. Catalogue, privacy and preserved security tests

24 focused R15 tests PASS: explicit public projection, publish/discovery exclusions, real-record URL construction, six question classes, contextual follow-up/non-redundant clarification, qualified season/wildlife advice, safe unknown/private/price/unavailable handling, exact artwork digest, opt-in/Production gates, scoped real Next header configuration, recognition lifecycle/denial/timeouts, speech interruption/failure/timeouts, stale-event cleanup, actual hero-effect fallbacks and reduced-motion gating.

Existing actual-handler R13 role/projection/canary tests and all other CR6/CR7 regressions run in the full suite. No distinct-role live JWT sessions, Auth users or new fulfilment fixtures were created. Deployed R14 security source is untouched. No new claim of populated live role-response proof is made.

## H. Commit

At this initial publication checkpoint, R15 commit/push/deployed identifiers are pending. No .DS_Store, generated Next environment file, credentials or .vercel cache is selected. Existing source remains `6023e6620db6f467a056b135f41f927571a5c5d9`; exact resulting publication identifiers will be recorded from actual evidence.

## I. Deployment

The human completed normal Vercel login; CLI 65.0.0 independently confirms account `kumudithak`. Normal CLI link/pull targets only existing project `prj_1UyIsBoedY2TF9rhHZhfywZ61pp0`, team `team_mJg3th6VO3aRCRLETmuswRWB`, `roam-ceylon/roam-ceylon`, Preview branch `commercial-readiness/staging`. Supabase URL verified as hvcggnuptrcsxtrcjnre. Vercel refuses to export the existing sensitive service-role value; its placeholder is not used for runtime publication or requested from the human. Normal Git-based Preview deployment will retain the existing remote secret in place.

The human explicitly authorized the normal staging auto-alias workflow after local build/security checks, followed immediately by deployed verification and restoration of R14 Preview if any check fails. This explicitly supersedes the original verify-before-alias sequence. Production and Authentication remain protected. No temporary/public deployment, protection bypass or Production operation is allowed.

Both non-secret demo switches were added ONLY to Preview / `commercial-readiness/staging`; no Production variables were added/changed. Authentication remains `all_except_custom_domains` (Standard Protection), protecting the Vercel staging alias. Normal Git publication is restricted to `HEAD:refs/heads/commercial-readiness/staging`, non-force, after confirming remote ancestry and validation. Rollback target is the existing immutable R14 Preview `roam-ceylon-6xtg38tbq-roam-ceylon.vercel.app`.

## J. Alias and protection

Persistent alias remains `https://roam-ceylon-git-commercial-readiness-staging-roam-ceylon.vercel.app/`, still assigned to R14 Ready Preview `dpl_6zJxMvDiHhbZT4JqV1WEH6AxFcmi`. Anonymous HTTP root returns 302 to Vercel `/sso-api`, confirming protection remains active. No Vercel Authentication settings or aliases were changed. R15 live checks are pending, not passed.

## K. Validation and changed files

Full suite **450 passed / 0 failed / 1 expected skip**, 451 registered. The skip is the optional account-date candidate hash check because that unrelated candidate is deliberately absent. Changed-file ESLint, explicit TypeScript, ordinary production build, explicitly scoped demo-enabled build and git diff --check PASS. A further production-mode build using actual staging public configuration also passed and loaded the real catalogue. Service-role credentials are not required by Ceylo and were not exported.

Logs: `/private/tmp/ceylo-r15-full-test.log`, `/private/tmp/ceylo-r15-eslint.log`, `/private/tmp/ceylo-r15-typescript.log`, `/private/tmp/ceylo-r15-build.log`, `/private/tmp/ceylo-r15-demo-build.log`.

Intended files: `.env.example`, `.gitignore` (exclude normal .vercel CLI cache), `app/globals.css`, `app/page.tsx`, `components/home/{hero,hero-media,hero-demo-video}.tsx`, `components/ceylo/{ceylo-companion.tsx,ceylo.module.css}`, `lib/{partner-demo.ts,types.ts}`, `lib/ceylo/{catalogue.ts,catalogue-server.ts,recommend.ts,voice.ts}`, `next.config.ts`, `public/partner-demo/ceylo-approved.png`, `tests/{ceylo-demo,ceylo-hero-lifecycle}.test.ts`, this document. No package, migration, allocation API/DTO or unfinished R12 change.

Local preview is already listening on 4185. If restarting manually, use this worktree and:

```sh
CEYLON_PARTNER_DEMO_HERO=1 CEYLON_DEMO_SCOPE=commercial-readiness-staging WATCHPACK_POLLING=true npm run dev -- --webpack --hostname 127.0.0.1 --port 4185
```

Do not start a second server on an occupied port. The previous 4180 preview was not altered. Real published recommendations require normal, verified staging Preview configuration; missing configuration intentionally produces an unavailable message.

## L. Limitations and protected scope

At the initial publication checkpoint, final deployed verification is pending; real catalogue success/links were verified locally against staging. Actual microphone transcription remains open. Native speech availability/voice/provider processing and YouTube playback/branding are browser-dependent. This is a guided demo, not an LLM or booking engine. Distinct-role JWT gaps from R14 remain; no synthetic business records were created to mask them.

No Production or historical-stabilization source/database/environment/alias/deployment changes. No database migration, schema/grant/RLS change, Auth identity, supplier, booking, receipt, payment or financial row. No account-date migration. No CR7 closure or Commercial Launch authorization.

## M. Proposed ten-minute review after protected deployment

1. 0–1 min: enter the authenticated staging homepage; confirm exact brand copy, muted cinematic hero and Pause/Play.
2. 1–2 min: open Ceylo; explain guided catalogue scope, exact mascot and voice/privacy disclosure.
3. 2–4 min: family beaches then December; discuss seasonal caveats; open an actual published destination and Experience, return home.
4. 4–6 min: ask Ella or wildlife; show relevant published links and no live availability/pricing promises.
5. 6–8 min: explicitly enable mic in a supported browser, ask a short English question, stop/review/edit the transcript, send; click Listen or opt into Speak replies, then Stop Speaking.
6. 8–9 min: Plan Your Journey, without submitting an enquiry or creating any record.
7. 9–10 min: mobile panel/Escape/text fallback; reiterate private demo, remaining verification limits, CR7 HOLD and no launch approval.

Status at initial commit checkpoint: validation complete / authorized staging publication pending. This is not a deployed PASS claim.
