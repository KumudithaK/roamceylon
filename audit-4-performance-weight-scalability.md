# Roam Ceylon Audit 4/5 - Performance, Application Weight & Scalability

**Audit date:** 11 August 2026  
**Scope:** read, analyse, measure and report only  
**Measurement labels:** **MEASURED** = executed locally; **STATIC ANALYSIS** = established from code/schema; **ESTIMATED** = reasoned projection, not a production measurement  
**Change control:** no application code, database schema, indexes, cache policy, dependencies, media or production data were changed.

## 1. Executive Performance Summary

Roam Ceylon is responsive enough for its current catalogue and controlled internal use, but it is not yet performance-ready for a broad public launch or material operational growth. The local business-rule suite is fast and green: **132/132 tests passed**, and a synthetic combined destination filter, experience filter, route estimate and insight evaluation averaged **0.016 ms at 3 destinations, 0.051 ms at 8, and 0.151 ms at 15**. The route/insight algorithms are not the present bottleneck.

The principal risks are data movement and orchestration:

- The Journey Builder bootstrap performs **16 Supabase reads across at least five sequential stages** and transfers the full published catalogue into a client component.
- The estimate endpoint performs up to **12 database reads per settled change**, including all published vehicles, all published guides and entire coverage-link tables.
- Destination detail pages use the full Journey Builder bootstrap; experience detail pages load the entire published editorial catalogue to resolve one slug.
- Traveller proposals use CSS background images and raw `<img>` elements rather than responsive Next image variants; long proposals can eagerly fetch many single-size remote images.
- Enquiry, accounting, resource and history screens contain unbounded client-side reads/rendering, and some write paths issue one request per allocation or attachment.
- No explicit application data cache or CMS-driven invalidation strategy was found.

The repository occupies **2.1 GB locally**, but this is not deployment weight: `.next` is **1.4 GB** of mostly development cache and `node_modules` is **706 MB**. Public static assets are **3.5 MB**. A clean production bundle baseline could not be produced because `next/font` attempted to fetch Google-hosted Manrope and Playfair Display files in the restricted audit environment and the build stopped after **19.19 seconds**.

## 2. Performance Release Position

**Position: NO-GO for an unqualified public launch performance sign-off.**

This conclusion is not based on slow local business calculations. It is based on the absence of a reproducible production build/bundle measurement, unoptimized proposal media on a core traveller surface, and no production-like network/database trace for the primary flows. These items must be resolved or measured before launch:

1. Make the production build independent of an unavailable build-time font host, then capture real production route bundles.
2. Establish a responsive, bounded media strategy for digital/print proposals.
3. Run production-like mobile/network traces for homepage, Journey Builder and 5/14/30-day proposals.
4. Add query/payload observability so broad reads and slow requests are visible.

The current catalogue can continue in controlled development. The broad catalogue/admin queries, pagination, caching and write batching are **before-scale** requirements rather than present P0 failures.

## 3. Build / Bundle Baseline

| Item | Result | Classification |
|---|---:|---|
| Repository working directory | 2.1 GB | MEASURED; not deployment size |
| `.next` | 1.4 GB | MEASURED; almost entirely `.next/dev`, including large Turbopack/Webpack caches |
| `node_modules` | 706 MB | MEASURED; install footprint, not browser transfer |
| `public` | 3.5 MB | MEASURED |
| TypeScript/TSX source files in `app`, `components`, `features`, `lib` | 168 | MEASURED |
| Client modules | 45 | MEASURED from `"use client"` directives |
| Direct production dependencies | 19 | MEASURED from `package.json` |
| Tests | 132 passed, 0 failed in 0.820 s | MEASURED |
| Clean production build | Failed after 19.19 s fetching two Google fonts | MEASURED |

The build failure occurred before a trustworthy production chunk report existed. Previous development chunks remain inspectable, but they include development runtime, source maps and instrumentation and **must not be treated as production bundle sizes**:

- homepage development chunk: 4,011,790 bytes raw / 887,014 bytes gzip;
- Journey Builder development chunk: 8,792,010 bytes raw / 1,922,950 bytes gzip;
- admin enquiry detail development chunk: 4,394,651 bytes raw / 992,485 bytes gzip;
- lazy pdf-lib development browser chunk: 3,457,868 bytes raw / 816,562 bytes gzip.

The pdf-lib import is dynamic in the export modules, so the separate development chunk is evidence of lazy separation, not evidence that PDF code is in every initial route.

## 4. Traveller-Facing Performance

**STATIC ANALYSIS:** The homepage reads all published themes and destinations in parallel, then waits before reading homepage hero configuration. It also hydrates the site footer, which issues a separate browser-side `website_settings` query on every public route. At the current local catalogue baseline of **8 themes and 32 destinations**, this is likely acceptable, but the waterfall and footer request are avoidable.

Public content access has no explicit `cache`, `unstable_cache`, revalidation tag or CMS invalidation call. The route model is inconsistent: some list pages can be statically emitted at build time, while experience and detail routes are dynamic. This creates two risks: repeated Supabase traffic on dynamic routes and stale build-time content on static routes.

The homepage hero poster is correctly served through `next/image` with `priority`; uploaded video uses `preload="none"`, reduced-motion handling and a poster, which are good controls. The development-only YouTube preview is excluded from production behavior by `NODE_ENV`.

## 5. Journey Builder Performance

**STATIC ANALYSIS:** `JourneyService.getJourneyBootstrapData()` executes 16 database reads:

1. themes and theme links (2);
2. destination links and destinations (2);
3. experience links, experiences, theme links and destination summaries (4);
4. stays (1), vehicles plus links (2), guides plus three link tables (4), partly parallel;
5. all active pricing-plan option metadata for the resulting resources (1).

The stages depend on IDs from preceding stages, creating at least five network waterfalls. Most resource queries use `select("*")`; the complete bootstrap is then serialized into the client Journey Builder. Local JSON catalogue source files total **652,504 bytes**, including **505,054 bytes** of experience editorial content. This is not a live payload measurement, but it demonstrates why full-row/full-catalogue transport can readily reach hundreds of kilobytes before RSC/JSON overhead and images.

Client filtering, route geometry and insights are inexpensive at supported journey sizes. A local synthetic microbenchmark used 5,000 iterations per scenario:

| Scenario | Synthetic catalogue | Combined mean |
|---|---:|---:|
| Small | 3 destinations / 24 experiences | 0.0161 ms |
| Medium | 8 destinations / 64 experiences | 0.0509 ms |
| Large supported route | 15 destinations / 120 experiences | 0.1508 ms |

These are CPU microbenchmarks, not page-load timings. The estimate request is debounced by 250 ms and aborts an older browser request, which is good. Journey persistence writes the comparatively small selection state to `localStorage` on changes; this is not currently material.

## 6. Journey Studio Performance

**STATIC ANALYSIS:** Journey Studio is a 32.9 KB client source module and loads a broad journey context plus history. Saving performs a POST and then a GET refresh. The server save path updates the curated journey, inserts change history, loads allocations and updates each affected allocation individually. Complexity is therefore **O(A)** database writes for `A` allocations, in addition to the base writes.

Change history stores full old/new JSON payloads and is read without pagination. Repeated edits increase both row count and duplicated JSON volume. At a few versions this is immaterial; at dozens or hundreds of edits per journey it increases transfer, parsing and DOM cost. This performance concern reinforces Audit 1/3 atomicity findings: a transactional batch would improve both correctness and latency.

## 7. Supplier / Allocation Performance

**STATIC ANALYSIS:** The allocation editor loads all candidate accommodations, vehicles, guides and active pricing plans needed for the workspace. Saving loops through allocations and performs an insert/update per row, then calls accounting synchronization and reloads all allocations. For 20 allocations this is already dozens of database operations; at 50 allocations latency and partial-failure exposure become substantial.

Candidate suitability filtering is primarily in application memory. This is workable for the current **10 stays, 10 vehicles and 6 guides**, but it will not scale efficiently to hundreds or thousands of supplier records. Supplier lookup should eventually become server-filtered and paginated while preserving the current allocation model.

## 8. Proposal Performance

**STATIC ANALYSIS:** Proposal composition uses batched resource reads rather than a query per itinerary line, and immutable snapshotting avoids repeated joins when a traveller views an issued proposal. Those are positive design choices.

The digital proposal renders the complete snapshot as one hydrated client tree. Cover, destination, stay and experience art is applied with CSS `background-image`; the logo and QR are raw `<img>` elements. This bypasses Next's responsive `srcset`, format negotiation and width-specific optimization. A 5-day proposal is likely manageable; a 14- or 30-day proposal can build a large DOM and request many remote images immediately. No lazy boundary or page virtualization was found. The QR also depends on `api.qrserver.com` at view time.

The secure proposal page queries a full proposal row even though only the customer-safe DTO is rendered. It writes view tracking on every view and then reads/returns state again. This is acceptable at low traffic but adds database writes to a read-heavy public surface.

## 9. Admin Performance

**STATIC ANALYSIS:** Admin is predominantly client-rendered and makes direct Supabase calls after session resolution. The following lists are not server-paginated:

- traveller enquiries: all rows, `select("*")`, then client filtering/search/rendering;
- CMS resource lists: all rows, client rendering;
- partner review histories/files: all rows for an application;
- several detail histories and proposal lists.

The dashboard makes six resource queries plus enquiry and partner queries. Enquiries and partner applications are capped at 100, but content counts are calculated from all returned resource rows rather than count-only aggregate queries. Once there are more than 100 enquiries, dashboard pipeline totals describe only the latest 100 while appearing global.

Large client modules reinforce hydration/maintenance cost: `journey-lifecycle-workspace.tsx` is 78.5 KB, `journey-account-review.tsx` 33.1 KB, `journey-studio.tsx` 32.9 KB and `resource-editor.tsx` 27.0 KB as source. Source size is not bundle size, but the breadth of responsibilities matches Audit 1's ARC-002 finding.

## 10. Accounting Performance

**STATIC ANALYSIS:** Accounting overview loads every account and every settlement, then loads linked enquiries and aggregates everything in the browser. There is no date window, active-status server filter, pagination or database aggregation. Its cost grows linearly with the complete accounting history, not with the visible active set.

Account detail performs one account query, five parallel collection queries, then one signed-URL request per attachment. Request count is **6 + N attachments** (excluding authentication). Transactions, lifecycle history, settlements and attachments are rendered without pagination. At the current early-stage volume this is workable; at 1,000 journeys it becomes a major staff latency and memory risk.

## 11. Image / Media Assessment

**MEASURED:** `public` contains four images totaling 3.5 MB:

| Asset | Bytes | Notes |
|---|---:|---|
| `public/og.png` | 2,002,297 | Social image; not normal page-body transfer |
| `public/assets/logo/roam-ceylon-elephant.png` | 1,179,393 | 1536×1024 source |
| `public/assets/logo/roam-ceylon-elephant-transparent.png` | 380,157 | 1536×1024 source |
| `public/assets/images/roam-ceylon-logo.png` | 91,634 | 600×400 source |

Thirty-four `next/image` usages and 24 explicit `sizes` usages provide a good base. Three raw `<img>` usages are concentrated in the proposal document. The transparent 380 KB logo is displayed at roughly 168–220 px; Next optimizes it in site/admin headers, but proposal output requests the source directly.

**STATIC ANALYSIS:** The CMS/migrations contain thousands of third-party image URL references (3,072 Pexels and 161 Wikimedia URL occurrences). This count includes repeated SQL/content history and is not a count of current page requests. Remote availability, transformation parameters and caching are outside Roam Ceylon's direct control.

CMS uploads allow storage-bucket-sized images (up to 10 MB), upload sequentially, and do not delete the underlying object when a URL is removed from a gallery. Partner media permits 10×10 MB plus 6×15 MB documents per application. Without compression, lifecycle cleanup and retention controls, Storage and image-optimization bandwidth will grow unnecessarily.

## 12. JavaScript / Dependency Weight

**MEASURED:** There are 19 direct production dependencies. Installed disk footprints are not browser transfer sizes; notable local packages include pdf-lib (~23 MB installed) and lucide-react (~36 MB installed). Named imports and bundler tree-shaking should reduce lucide delivery. pdf-lib is dynamically imported only when an admin export is requested, which is appropriate.

Motion is used for purposeful card/map/transition behavior. Supabase browser clients are required by many admin/client modules. No safe conclusion about production first-load JavaScript can be made until the font-independent production build succeeds and route analyzer output is captured.

`npm test` emits `MODULE_TYPELESS_PACKAGE_JSON` for each TypeScript test file. The overhead is small (the complete suite still finishes in ~0.82 s), but it creates noisy CI output and confirms Audit 1 QA-002.

## 13. API Payload Assessment

No production HTTP payload trace was available because the existing local listener could not be reached from the audit command sandbox, and starting a second server was prevented by the existing Next lock. The following are therefore **STATIC ANALYSIS / ESTIMATED**:

- Journey bootstrap is the highest-risk public payload because it serializes full themes, destinations, experiences, stays, vehicles, guides and pricing-plan labels into a client component.
- Admin enquiry and accounting queries use `select("*")`, transmitting large JSON state/snapshots not always needed by list cards.
- Secure proposal server reads use `select("*")`, including internal/snapshot fields before redaction; the browser receives the customer DTO, but database-to-server transfer remains broad.
- Proposal snapshots grow linearly with itinerary days, allocated services, benefits and descriptive text. Snapshot immutability is correct; list endpoints should avoid returning full snapshots.

Payload budgets should be established for RSC/HTML, first-load JS, journey bootstrap JSON, estimate responses, proposal HTML and admin list responses.

## 14. Database Query Assessment

**STATIC ANALYSIS:** Primary query shapes and growth behavior:

| Surface | Query behavior | Scale risk |
|---|---|---|
| Homepage | themes + destinations, then hero; footer client query | Low now; cacheable repeated reads |
| Destination detail | complete 16-read Journey bootstrap to find one destination | High catalogue amplification |
| Experience detail | complete editorial experience catalogue and relationships to find one slug | High catalogue amplification |
| Journey Builder | 16 reads / multi-stage bootstrap | High initial latency/payload |
| Estimate | 11 parallel reads + pricing plans; all vehicles/guides/link tables | High repeated catalogue scanning |
| Enquiry inbox | all enquiries `select(*)` | Unbounded |
| Accounting overview | all accounts + all settlements + linked enquiries | Unbounded |
| Allocation save | one upsert per allocation + sync + reload | Write amplification |
| Account detail | fixed collections + one signed URL per attachment | N+1 attachment calls |

Metadata generation and page rendering each invoke the same detail-loading helpers. The application does not wrap them in React `cache`; underlying identical fetch memoization may reduce some duplicate GETs, but this was not proven by a runtime trace and must not be relied upon without measurement.

## 15. Database Index Assessment

**STATIC ANALYSIS only; no remote `EXPLAIN (ANALYZE, BUFFERS)` was run.** Existing indexes are generally sensible for current relationships and operational records: published content status/order, destination relationship reverse lookups, enquiry status/date, proposal enquiry/version and public token, allocation enquiry/review, accounting account/status/due date, transaction account/date, attachments, change history and benefits.

Potential gaps or mismatches requiring measured confirmation:

- `pricing_plans_entity_idx` is `(entity_type, entity_id, active, sort_order)`, while hot bootstrap/estimate reads filter by `entity_id` and `active` without `entity_type`; PostgreSQL cannot efficiently use the leading column for that shape at large scale.
- The unfiltered enquiry inbox orders by `created_at`; the known composite index begins with `status`, so it may not serve the all-status ordering efficiently.
- Unfiltered account/settlement overview reads are inherently unbounded even with indexes; query design and pagination matter more than adding indexes.
- Future supplier-centric allocation reporting will need measured indexes on individual supplier foreign keys if it queries allocations by accommodation/guide/vehicle/experience.

Do not add indexes speculatively. Capture `EXPLAIN` plans at representative 1k/10k/100k volumes first.

## 16. N+1 Findings

Confirmed query-per-item patterns:

1. **Allocation save:** one database upsert per allocation, followed by accounting synchronization and a reload.
2. **Journey Studio allocation invalidation:** one update per affected allocation.
3. **Accounting receipts:** one `createSignedUrl` call per attachment.
4. **Partner application review:** one signed-URL call per submitted file.
5. **Pricing-plan reorder:** one update per pricing plan.
6. **Default benefit materialization:** proposal preparation can insert default assignments individually.

The Journey Builder bootstrap is broad and waterfall-heavy but not an N+1: its request count is approximately constant while its row/payload volume grows. Proposal resource resolution is generally batched by ID and is not a per-line read loop.

## 17. Caching / Revalidation Assessment

No application-level `unstable_cache`, React `cache`, `revalidateTag`, `revalidatePath` or explicit route revalidation policy was found. Dynamic detail/Builder/proposal surfaces therefore re-query Supabase; potentially static public pages depend on build behavior and have no visible CMS invalidation path.

Recommended future policy:

- cache published themes/destinations/experience summaries and homepage settings with tagged invalidation;
- invalidate exact entity/list tags after successful CMS publication;
- never shared-cache traveller proposals, admin, pricing, accounting or token-protected responses;
- set explicit private/no-store behavior for authenticated/sensitive APIs;
- cache only customer-safe immutable proposal snapshots at a private edge if the security model later permits it.

Caching must follow the security conclusions in Audit 2; confidential supplier/pricing/traveller data must not enter shared caches.

## 18. Mobile / Slow-Network Assessment

No Lighthouse/WebPageTest/mobile browser trace was possible in the audit environment, so this section is **STATIC ANALYSIS / ESTIMATED**.

Highest mobile risks are the full Journey Builder RSC payload and hydration, third-party proposal images, large proposal DOM, and sequential network waterfalls before the Builder becomes interactive. The 250 ms estimate debounce and request cancellation help interaction responsiveness. Responsive image `sizes`, lazy default behavior for most Next images, reduced-motion handling and video `preload="none"` are positives.

Required measurement profiles: 360×800 viewport, 4× CPU slowdown, Slow 4G and 150 ms database latency. Test cold and warm navigation, image-cache misses, 5/14/30-day proposals, and recovery after one failed image/API request.

## 19. Storage / Data Growth Assessment

Growth drivers are:

- immutable proposal versions containing full customer snapshots;
- full old/new Journey Studio JSON in every change-history row;
- accounting attachments and partner application documents;
- public CMS media that is detached from records but not removed from Storage;
- repeated proposal/customer/commercial snapshots across lifecycle stages;
- Next image optimizer cache at the hosting layer for many third-party URL/size variants.

The local `.next` development cache reaching 1.4 GB demonstrates developer-cache churn, not production Storage consumption. Production capacity planning should separately track database row/JSON bytes, public/private Storage bytes, image transformation/cache bandwidth, proposal views, and backup retention.

At 1,000 journeys, unbounded admin reads and full histories become noticeable. At 10,000, server pagination/aggregation and retention are required. At 100,000, proposal/history partitioning or archival, database connection pooling, asynchronous document/media work and explicit operational reporting stores should be evaluated.

## 20. Scalability Assessment

| Scale | Expected position | Primary concern |
|---|---|---|
| Current catalogue / controlled use | Functionally usable | Missing production measurement; proposal media |
| 1,000 journeys / hundreds of suppliers | Degradation likely | Unbounded admin lists, broad supplier/catalogue reads, write loops |
| 10,000 journeys / thousands of suppliers | Not acceptable without remediation | Browser aggregation, history/snapshot transfer, estimate scans, N+1 writes |
| 100,000 journeys | Architecture needs operational scaling layer | Reporting queries, archival/partitioning, jobs, observability, storage lifecycle |

The core domain model does not need replacement. The system can scale through narrower repository methods, server pagination, batched transactional commands, cacheable public DTOs, immutable customer snapshots, asynchronous media/document work and measured indexing. The public Journey Builder should receive only data required for the current step or compact catalogue DTOs, not full editorial/supplier records.

## 21. Findings Table

| ID | Severity | Area | Evidence | Current impact | Scale impact | Recommended remediation | Launch blocker |
|---|---|---|---|---|---|---|---|
| PERF-001 | P1 | Build | Clean build failed after 19.19 s fetching Manrope/Playfair from Google | No verified production bundle | CI/release builds depend on external availability | Self-contain or reliably provision fonts; rerun clean build and bundle capture | YES |
| PERF-002 | P1 | Proposal media | CSS backgrounds/raw images; no responsive variants; complete hydrated document | Slow/bandwidth-heavy long proposals possible | Linear DOM/image growth for 14/30-day plans | Create print-compatible optimized image variants, lazy sections and proposal performance budgets | YES |
| PERF-003 | P1 | Journey Builder | 16 reads, five stages, full-row/full-catalogue client bootstrap | Extra initial latency/payload | Grows with every content/supplier row | Introduce compact DTOs and step/selection-scoped loading; preserve mappings | NO |
| PERF-004 | P1 | Estimate API | 11 parallel reads + plan read; all vehicles/guides/coverage tables per settled change | Repeated DB work | Catalogue scans multiply with traffic | Query only eligible candidates; cache public configuration/bands; instrument latency | NO |
| PERF-005 | P1 | Admin lists | Enquiries, resources, accounts, settlements and histories read/render without pagination | Acceptable only at low row count | Browser memory/latency and DB transfer grow linearly | Server pagination, filters, count aggregates and bounded histories | NO |
| PERF-006 | P1 | Allocation writes | Per-allocation upserts, per-allocation invalidation, sync and reload | Staff saves can feel slow | Dozens/hundreds of round trips | Transactional batch RPC with returned changed rows | NO; required before scale |
| PERF-007 | P1 | Public detail reads | Destination uses complete Builder bootstrap; experience loads all editorial records | Catalogue amplification | Every detail view worsens as content grows | Direct slug query plus only related destination/theme/experience DTOs | NO |
| PERF-008 | P2 | Caching | No explicit content cache/tag invalidation policy | Repeated reads or stale build output | Higher database load/inconsistent freshness | Tagged public caching with CMS invalidation; sensitive no-store policy | NO |
| PERF-009 | P2 | Accounting | Overview reads all accounts/settlements; detail is 6 + N attachment requests | Low-volume only | Severe staff latency at 1k–10k journeys | Aggregate queries, active/date filters, pagination, batched signed URLs | NO |
| PERF-010 | P2 | Media/storage | 3.5 MB local images; up to 10 MB CMS images; detached media not deleted | Waste and variable loads | Storage/transform bandwidth grows indefinitely | Upload validation/compression, derivatives, ownership and cleanup workflow | NO |
| PERF-011 | P2 | Client hydration | 45 client modules; 78 KB lifecycle and 44 KB Builder source components | Broad hydration and change cost | Larger admin bundles as features accumulate | After stabilization, split data/controller/presentation boundaries and lazy panels | NO |
| PERF-012 | P2 | Index shape | Pricing plan hot reads omit leading `entity_type`; all-status enquiry order lacks matching known index | Probably small now | Sequential scans/sorts at large row counts | Verify with representative `EXPLAIN`; add only measured indexes | NO |
| PERF-013 | P2 | Histories/snapshots | Full old/new JSON history and versioned full proposal snapshots | Correct but duplicated data | Transfer/storage grows with edits/versions | Summary list DTOs, lazy version bodies, retention/archive policy | NO |
| PERF-014 | P2 | Dashboard | Enquiries/partners capped at 100 while metrics appear global; content rows used for counts | Misleading after first 100 | Inaccurate operational dashboards | Database count/aggregate endpoints with explicit windows | NO |
| PERF-015 | P2 | Observability | No route/query/payload performance telemetry; runtime HTTP trace unavailable | Regressions invisible | Cannot manage production SLOs | Add server timings, query durations, payload sizes, Web Vitals and alerts | YES for measurement sign-off |
| PERF-016 | P3 | Test runtime | Module-format warning for each TS test | Noise; suite still 0.82 s | Minor CI overhead | Configure test module format | NO |
| PERF-017 | P3 | Footer | Client Supabase settings request on every public route | One extra request/hydration | Repeated low-value traffic | Supply cached public footer DTO from server layout | NO |

No P0 performance defect was proven. P1 here means high user/business impact or a near-term scaling constraint, not a confirmed outage.

## 22. Cross-Audit Correlation

- **Audit 1 PERF-001** identified raw proposal images; this audit expands it with exact rendering paths and 5/14/30-day growth risk (PERF-002).
- **Audit 1 ARC-002** identified large mixed-responsibility components. The measured 78.5 KB lifecycle workspace, 43.7 KB Builder and 33 KB admin modules support PERF-011, but refactoring remains secondary to security/integrity stabilization.
- **Audit 1 DATA-001 / Audit 3 allocation integrity** identified partial per-allocation writes. The same loops create write amplification and staff latency (PERF-006); a transactional batch improves both correctness and performance.
- **Audit 1 OBS-001** directly explains why production latency, payload and query percentiles are unavailable (PERF-015).
- **Audit 2 SEC-006** identified unbounded anonymous submissions and application JSON. Abuse controls are also capacity controls; durable rate limits and input/payload bounds protect database and Storage cost.
- **Audit 2 caching/privacy findings** require sensitive proposal/admin/accounting responses to remain private/no-store. Performance caching must use public DTOs and tagged marketing content only.
- **Audit 3 BIZ-003/BIZ-004/BIZ-005** require transactional lifecycle and financial commands. Performance batching must not be implemented as an independent shortcut that weakens those invariants.
- **Audit 1 QA-002** is reproduced: all tests pass, but Node emits module-format warnings.

Security and data-integrity P0 blockers from Audits 1–3 remain higher release priority than the before-scale optimizations in this report.

## 23. Recommended Optimization Order

### REQUIRED FOR LAUNCH

1. Resolve build-time font availability and capture a clean production build, route bundles and first-load JS.
2. Optimize proposal media without changing proposal content/brand; validate 5-, 14- and 30-day digital/print proposals on mobile.
3. Add production-like measurements: Web Vitals, server response time, Supabase query durations, response bytes and errors.
4. Establish explicit private/no-store behavior for sensitive routes and a safe public-content caching policy consistent with Audit 2.
5. Complete the P0 security/integrity remediations from Audits 1–3 before using performance caches or batching around sensitive workflows.

### BEFORE SCALE

1. Replace full-catalogue destination/experience detail loading with direct slug repositories.
2. Reduce Journey Builder bootstrap to compact/step-scoped DTOs and narrow estimate candidate queries.
3. Add server pagination, filtering and aggregate counts to enquiries, resources, accounting and histories.
4. Replace allocation/update loops with transactional batch commands.
5. Batch private attachment URL issuance and lazy-load history/attachments.
6. Measure representative query plans before adding pricing/enquiry/supplier-reporting indexes.
7. Add upload compression/derivatives, object ownership and orphan cleanup.

### FUTURE

1. Archive/partition large proposal, history and accounting datasets when measured row/JSON growth warrants it.
2. Move heavyweight exports/media preparation to background jobs if concurrency requires it.
3. Add operational read models/materialized aggregates for finance and management reporting.
4. Introduce CDN/cache lifecycle controls for owned media and monitor image transformation spend.
5. Split large client modules after behavior and transactional boundaries are stabilized.

## 24. Performance Tests Recommended Before Launch

1. **Clean production build:** offline/restricted-egress and normal CI; capture route table, first-load JS, chunk duplication and source-map exclusions.
2. **Lighthouse/WebPageTest:** homepage, destination, experience, Builder first step, Builder review, secure proposal; mobile Slow 4G and desktop; cold/warm cache.
3. **Journey scenarios:** 3, 8 and 15 destinations with realistic experiences/preferences and 150 ms simulated database latency; measure bootstrap TTFB/bytes, hydration and estimate p50/p95/p99.
4. **Proposal scenarios:** 5, 14 and 30 days; measure HTML/RSC bytes, image request count/bytes, LCP, memory, print preview and low-memory mobile behavior.
5. **Admin scenarios:** 100/1,000/10,000 enquiries; 100/1,000 accounts; 20/50 allocations; 10/100 attachments; verify pagination and interaction latency.
6. **Database load:** representative anonymized 1k/10k/100k datasets; `EXPLAIN (ANALYZE, BUFFERS)` for content, pricing, enquiry, proposal, allocation and accounting hot queries.
7. **Concurrency:** 25/100 simultaneous estimate requests, proposal views and staff list reads; verify connection-pool saturation and rate limits without stressing production.
8. **Storage/media:** upload limit, compression, failed-upload cleanup, orphan detection, signed URL batching and third-party image failure fallback.
9. **Regression budgets:** CI thresholds for route JS, RSC/JSON payload, image bytes, database query count, LCP/INP/CLS and proposal render time.
10. **Observability drill:** trace one traveller from homepage to enquiry, one staff allocation save and one proposal view with correlated request/query IDs and redacted logs.

AUDIT 4 COMPLETE – NO APPLICATION CODE OR DATABASE CHANGES MADE
