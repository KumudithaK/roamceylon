# Roam Ceylon Audit 5/5 — UX, Accessibility & UAT Readiness

Audit date: 11 August 2026  
Scope: read-only assessment against WCAG 2.2 AA principles; this is not a formal conformance certification.  
Evidence: source review, desktop and 360 × 800 browser checks on localhost, keyboard/semantic inspection, computed-colour contrast measurement, and the existing non-destructive test suite. No production forms or financial actions were submitted. `npm test` passed 132/132 tests. No dedicated accessibility runner is configured, so automated accessibility results are not claimed.

## 1. Executive UX Summary

Roam Ceylon presents a distinctive, premium DMC proposition. Homepage intent, destination storytelling, journey-preference language, proposal structure, and the separation of traveller preferences from internal allocation are generally clear. The proposal is especially strong: it explains route, days, stays, transport, guides, inclusions, investment, payment schedule, validity and next steps in one branded document.

The product is not yet ready for unassisted real-traveller UAT or public launch. No UX P0 was found, but four high-confidence P1 UX/accessibility failures affect core work: the seven-step Builder overflows at 360 px, Builder validation can appear more than 2,000 px above the action without moving focus or viewport, important selectable controls do not expose state programmatically, and normal/small gold or stone text repeatedly fails 4.5:1 contrast. Journey Studio destination ordering is also pointer-drag-only. Audits 1–4 add independent security, business-integrity and performance blockers.

## 2. UX / UAT Release Position

**Position: HOLD for public launch and real-money testing; suitable only for supervised, non-production UAT after the P1 UX items are corrected.** Desktop discovery and proposal presentation are credible. Mobile Builder completion, keyboard/screen-reader state, and staff keyboard operation are not sufficiently reliable. Live staff and traveller-proposal end-to-end checks were blocked because no test staff account or disposable valid proposal token was available; those gaps are not treated as passes.

## 3. Traveller Journey Assessment

The conceptual route—Discover → Theme → Destination → Experience → Preferences → Details → Insights → Review → Proposal—is coherent and uses traveller language rather than supplier/database language. Destination pages expose a clear reason to visit, related experiences, location context, accommodation and a journey CTA. The Builder preserves selections across refresh, presents destination-specific stay/specialist preferences and journey-wide primary-guide/transport preferences, and never exposes named suppliers.

The main journey risk is interaction recovery: a mobile traveller can press Continue, remain near the bottom of a long page, and receive no visible explanation because the alert is rendered far above. Persisted state also resumes silently with no conspicuous “resume/start over” choice, which can surprise first-time or shared-device users.

## 4. Homepage / Discovery Assessment

Measured strengths:

- The homepage immediately states the offer (“Stop browsing itineraries. Build yours.”), supplies a primary CTA, and provides theme-led discovery.
- Semantic `main`, headings, a skip link, meaningful image alt text, named primary navigation and a 48 × 48 mobile menu control were observed.
- At 360 px the homepage had no horizontal overflow; the mobile menu and 44 px “Start designing” action remained usable.
- Ahungalla’s detail page had one H1, logical H2 sections, no horizontal overflow at desktop, no unlabelled form controls, relevant experiences and direct journey CTAs.

Trust gaps: the footer provides contact details but does not link to the existing Terms page and exposes no Privacy link. Current-page navigation is visual only; neither public nor Admin links use `aria-current`. The development YouTube background iframe remains in the accessibility tree with its own controls/headings; it is development-only, but creates noisy local assistive-technology testing.

## 5. Journey Builder Assessment

The seven stages and stage titles are understandable. Theme filtering, destination union, experience selection, preference grouping, participant constraints and persistence are backed by passing domain tests. Empty states are explicit, and supplier identities are correctly deferred.

Measured failures:

- At 360 px, `innerWidth=360` but document `scrollWidth=663`; the seven step controls are the cause and are only about 32 px high.
- Current/selected state is visual. Step controls lack `aria-current`; theme/destination cards and guide-language chips lack `aria-pressed`.
- Clicking an unavailable future step appears actionable but produces no result or explanation.
- After invalid Continue, the alert’s measured rectangle was `top=-2171`, `bottom=-2117` while the action retained focus at `scrollY=4268`.

## 6. Plan – Stay / Transport / Guide Assessment

The preference model is one of the clearest areas. Copy distinguishes a journey-wide primary guide from destination specialists, keeps named partners internal, and shows each destination’s experiences, stay class, planned nights and notes. Transport uses one journey default plus leg-specific exceptions and displays From/To context.

Issues: every leg selector has the same accessible name, “Transport preference,” rather than including its From/To route. Guide-language toggle state is not announced. Recommendations by party size are advisory, which is appropriate, but the long details step magnifies the validation-recovery problem.

## 7. Estimated Range Assessment

When complete inputs exist, the summary presents per-person and total ranges, duration, factors and a clear statement that the final proposal confirms the investment. Existing tests cover adults, families, infants, premium preferences, transport, primary/no guide, incomplete rates and supplier redaction. The fallback “Your planning range is taking shape” is honest and avoids inventing a price.

The range is not a commercial acceptance value, which is communicated well. The remaining risk is technical rather than copy-related: Audit 3’s endpoint-distance and pricing-integrity findings and Audit 4’s estimate-query costs must be resolved before relying on the range at scale.

## 8. Enquiry Submission Assessment

The modal collects name, WhatsApp, email, dates and optional country/requests; validation messages are human-readable; submission disables the main action; the success view states that a designer will respond within 24 hours and that no payment is taken. This is strong expectation-setting.

The dialog has `role="dialog"`, `aria-modal` and a labelled title, but no focus trap, initial-focus movement or focus restoration. Field-level React Hook Form errors are visible but not explicitly announced. A safe submission was not made because it would create production-connected data.

## 9. Secure Proposal Assessment

Static review shows a premium, comprehensive document with version/reference, traveller identity, dates, route, day-by-day plan, stays, transport, guides, experiences, inclusions/exclusions, one total, per-person equivalent, payment schedule, important information, validity, terms, benefits, contact and next steps. Old/superseded states are explained and acceptance can be paused when a newer version is required.

The proposal is very long and has no in-page contents/jump navigation or persistent return-to-actions mechanism. A live token view was intentionally not exercised because viewing changes engagement state and no disposable token was provided. Secure-proposal UAT therefore remains environment-blocked.

## 10. Proposal Price / Transparency Assessment

Traveller pricing is appropriately separated from internal cost/margin. The proposal displays one total, per-traveller equivalent, customer-safe category breakdown, mandatory-charge assurance, optional items outside the total, and deposit/balance schedule. This is materially clearer than a directory-style itemized supplier bill.

Audit 3 BIZ-017 still requires a defined rule for allocating selling price to traveller-safe categories; otherwise “Other” can absorb margin/operations disproportionately. BIZ-005 also means an accepted price can diverge from later supplier obligations. These are real-money blockers even though the presentation itself is clear.

## 11. Proposal Acceptance / Change Request Assessment

The actions are understandable and version-specific. Acceptance restates the exact version and total and requires name, email and terms acknowledgement. Change requests preserve the current proposal and capture category plus detail. Success messages explain what happened.

The action overlay lacks `role="dialog"`, `aria-modal`, labelled-dialog wiring, focus containment, Escape handling and focus restoration. Concurrent accept/change safety and forged Admin acceptance remain blocked by BIZ-003 and SEC-002; UI clarity does not mitigate those domain/security risks.

## 12. Admin Information Architecture

Permission-filtered navigation groups the major jobs logically: Overview, Enquiries, Journey Studio, Accounting, content, suppliers, benefits and settings. Restricted modules show an explicit access message. This reflects the actual capability model rather than only hiding content cosmetically.

The active module is only visual (`aria-current` absent). On narrow screens the entire dark sidebar precedes the workspace instead of collapsing into a staff navigation control, creating a long pre-content journey. Audit 2 shows that underlying access control does not yet safely match the apparent role separation, so staff trust in the UI would be misplaced until RLS/API remediation.

## 13. Journey Studio Assessment

The Studio correctly preserves the original brief, separates curated work, exposes dates/pax, route, experiences, transport, guides and internal notes, shows validation and history, and warns on browser unload when dirty. Removing a destination with dependent content requires confirmation. Experience ordering has labelled move buttons.

Destination ordering itself is HTML drag-and-drop only; keyboard users receive no equivalent move controls or position announcements. There is no conflict UI for simultaneous designers (BIZ-016), so the interface can silently lose another user’s work even though local unsaved-change protection exists.

## 14. Supplier Allocation Assessment

The traveller request and internal allocation are visually separated, provider selectors use existing supplier data, saved rates can populate proposal-rate fields, and allocation history/retirement language protects commercial history. This is conceptually appropriate for a DMC.

Live allocation UAT was blocked by authentication. Prior audits show partial multi-write risk, unsuitable supplier selection risk, no transactional batch save and broad authorization. Those conditions make a visually successful allocation unsafe to treat as operational proof.

## 15. Proposal Admin Assessment

Static review supports generate, preview, version, send and traveller-link lifecycle, with immutable version presentation and a clear internal/customer separation. The preview is visually close to the traveller document, reducing surprise.

Full generate → send → traveller-view → revise → V2 verification was not executed. SEC-002, BIZ-002, BIZ-003 and workflow atomicity findings block sign-off. Long proposal preview also lacks compact navigation for staff reviewing 14–30-day journeys.

## 16. Accounting Assessment

Accounting uses recognizable summaries for revenue, received amounts, projected/realized profit, supplier commitments, paid/waived amounts, outstanding balances, refunds and cancellation recoverability. Settlement review visibly distinguishes pending and saved items, and destructive/history-changing actions generally use explicit labels or confirmation.

Live finance UAT was blocked by authentication and no disposable account. BIZ-004 (duplicate payments/refunds), BIZ-005 (accepted snapshot divergence), BIZ-013 (force-close obligations) and SEC-004/011 prevent real-money testing. These are not cosmetic concerns.

## 17. Operations Handoff Assessment

The model exposes accepted benefits, fulfilment state, supplier confirmation and journey context, and keeps operational promises tied to accepted proposal data. Empty operational states are explained.

No authenticated accepted journey was available for handoff UAT. Audit 3 identifies stale dates and mutable post-acceptance allocation sources; therefore operations cannot yet rely on the screen as the authoritative trip instruction set.

## 18. Mobile / Responsive Assessment

Homepage and destination discovery respond cleanly at narrow width. The site header becomes a usable mobile menu and public content stacks without measured overflow.

The Builder fails narrow-width reflow (`663 px` content in a `360 px` viewport), its step controls fall below the 44 × 44 target, and long-page validation recovery is ineffective. Admin navigation is not designed as a mobile workspace. At 200% effective zoom/narrow layout, these defects would be amplified; no claim of complete 200% zoom support can be made.

## 19. Accessibility Assessment

Positive evidence includes a skip link, semantic landmarks/headings, labelled inputs, meaningful image alt text, native controls, visible focus treatment on shared buttons/selected header links, reduced-motion CSS, error alerts in key forms, and responsive public navigation.

The audit found material WCAG 2.2 AA risks: missing programmatic selected/current state, pointer-only Studio reordering, modal focus/semantics gaps, repeated ambiguous control names, touch targets below 44 px, and low contrast. Computed samples were approximately 2.69:1 (`stone` on sand), 3.01:1 (`stone` on white), 2.72:1 (`gold` on sand) and 3.04:1 (`gold` on white), all below 4.5:1 for normal text. No formal certification is claimed.

## 20. Error / Loading / Empty / Success States

Strengths: Builder and admin empty states are specific; enquiry and proposal submission disable during network activity; success copy states the next action; admin load failures commonly use alert styling; skeletons exist for long-loading dashboards/lists; proposal terminal states are explained.

Weaknesses: Builder error placement is disconnected from the initiating control; many Admin success/error messages are ordinary paragraphs rather than reliable live regions; future-step clicks fail silently; modal validation does not consistently focus the first invalid field; raw database errors still appear in some staff screens (also a security/usability concern from Audit 2).

## 21. Terminology / Copy Findings

The core language—journey, proposal, traveller preferences, Roam Ceylon allocation, primary guide, local specialist—is consistent and appropriately DMC-oriented. Proposal commercial language is clear and avoids exposing margin/supplier cost.

One visible inconsistency remains: the summary footer says “before requesting your quote” while the primary action says “Request Journey Proposal” (`journey-builder.tsx:170`). “Personal quotation” also remains in the Admin inbox fallback. These are P3/P2 consistency issues, not redesign needs.

## 22. Traveller UAT Results

| Scenario | Result | Evidence / blocker |
|---|---|---|
| T1 Couple | **FAIL – UX** | Core flow is understandable, but measured mobile overflow and invisible validation recovery can prevent completion. No production enquiry was submitted. |
| T2 Family (3/3/3) | **PASS WITH MINOR ISSUES** | Existing family/infant estimate and participant-cap tests pass; counts are required. Full submitted journey/proposal was not created. |
| T3 Slow journey (14 days/3 stops) | **PASS WITH MINOR ISSUES** | Duration/range and insight tests pass; long-proposal navigation remains weak. |
| T4 Mixed transport | **PASS WITH MINOR ISSUES** | Global plus per-leg transport model and endpoint-leg tests pass; repeated accessible names reduce screen-reader clarity. |
| T5 No primary guide + specialist | **PASS WITH MINOR ISSUES** | Allocation tests explicitly pass this model; selectable state is not programmatically exposed. |
| T6 Proposal revision | **BLOCKED BY ENVIRONMENT** | No disposable sent V1/test staff session/token; BIZ-003/SEC-002 also block trustworthy lifecycle sign-off. |
| T7 Acceptance | **BLOCKED BY ENVIRONMENT** | No disposable active proposal token; static UI is clear, but BIZ-003 and SEC-002 are release blockers. |

## 23. Staff UAT Results

| Scenario | Result | Evidence / blocker |
|---|---|---|
| S1 Journey Designer | **BLOCKED BY ENVIRONMENT** | Login page available but no test credentials. Static review found pointer-only destination ordering and BIZ-002/BIZ-016 risks. |
| S2 Supplier / Partner | **BLOCKED BY ENVIRONMENT** | No authenticated allocation workspace or disposable journey; Audit 1 partial writes and BIZ-009 remain. |
| S3 Proposal | **BLOCKED BY ENVIRONMENT** | No safe generate/send target; SEC-002 and BIZ-002 block lifecycle trust. |
| S4 Revision | **BLOCKED BY ENVIRONMENT** | No V1/V2 fixture; BIZ-003 and workflow atomicity block sign-off. |
| S5 Finance | **FAIL – BUSINESS LOGIC** | BIZ-004/005 and SEC-004/011 make real-money operations unsafe regardless of UI. |
| S6 Cancellation | **FAIL – BUSINESS LOGIC** | Review UI is understandable, but BIZ-004/013 and concurrency/idempotency gaps prevent safe real-money UAT. |
| S7 Operations | **BLOCKED BY ENVIRONMENT** | No accepted test journey; BIZ-005/012 prevent authoritative handoff sign-off. |

## 24. Findings Table

| ID | Severity | Surface | User | Evidence | User impact | Recommended remediation | Launch blocker | Related audit ID |
|---|---|---|---|---|---|---|---|---|
| UX-001 | P1 | Builder mobile | Traveller | 360 px viewport measured `scrollWidth=663`; seven step controls ~32 px high | Horizontal panning, obscured progress and small targets in the primary conversion flow | Make progress reflow/scroll intentionally, preserve visible current step, and meet 44 × 44 target | YES | PERF-003 |
| UX-002 | P1 | Builder validation | Traveller | After invalid Continue, alert was >2,000 px above viewport and focus stayed on Continue | Traveller sees no reason progress failed and may abandon | Place an error summary beside the action and focus/scroll to summary or first invalid field | YES | — |
| A11Y-001 | P1 | Builder selection/progress | Traveller | Choice cards/language chips lack `aria-pressed`; current step lacks `aria-current` | Screen-reader users cannot determine selections or position | Expose selected/current/disabled state programmatically and announce step changes | YES | — |
| A11Y-002 | P1 | Public/Admin palette | All | Computed normal-text samples: 2.69–3.04:1 against solid sand/white | Labels, hints and required markers are difficult to read | Define AA-safe semantic text tokens; verify every state at 4.5:1 | YES | — |
| A11Y-003 | P1 | Journey Studio | Staff | Destination cards use `draggable` only; no keyboard move actions | Keyboard staff cannot complete route ordering | Add labelled move up/down controls and announce new position | YES | ARC-002 |
| A11Y-004 | P2 | Enquiry/proposal modals | Traveller | Quotation has dialog role but no focus management; proposal action overlay has no dialog semantics | Focus can escape/be lost; context is unclear | Use a tested accessible dialog with initial focus, trap, Escape and restoration | NO | — |
| A11Y-005 | P2 | Transport legs | Traveller | Every route select is named only “Transport preference” | Multiple controls are indistinguishable in a screen-reader control list | Include From/To in each accessible name/description | NO | — |
| UX-003 | P2 | Builder progress | Traveller | Future step buttons look enabled but do nothing and provide no feedback | False affordance and uncertainty about navigation | Mark unavailable steps disabled or explain prerequisites | NO | — |
| UX-004 | P2 | Builder persistence | Traveller | Local state silently resumes; no prominent resume/start-over choice observed | Shared-device privacy and unexpected stale journey state | Add explicit resume/start-new disclosure and clear-state control | NO | SEC-010 (related privacy pattern) |
| UX-005 | P2 | Admin responsive navigation | Staff | At narrow width the full sidebar stacks before main content | Repetitive scrolling and slower urgent mobile work | Provide a compact authenticated mobile navigation without changing module IA | NO | — |
| UX-006 | P2 | Long proposal | Traveller/staff | Full document has many long sections and actions only after content; no contents/jump aid | Hard to review/revisit one section on mobile or long journeys | Add compact section navigation/progress and return-to-action affordance | NO | PERF-002 |
| UX-007 | P2 | Navigation state | All | Public/Admin navigation computes active state visually but does not set `aria-current` | Current location is not announced | Add `aria-current="page"` to active links | NO | — |
| UX-008 | P2 | Trust/footer | Traveller | Terms route exists, but footer links omit Terms and Privacy | Legal/privacy information is hard to discover before sharing PII | Add clearly named legal/privacy links and verified company identity path | NO | SEC-007/008 |
| UX-009 | P2 | Staff concurrency | Journey Designer | Local dirty warning exists, but saves lack revision conflict UI | One designer can silently overwrite another | Surface compare-and-set conflicts and preserve both revisions | NO | BIZ-016 |
| UX-010 | P3 | Terminology | Traveller/staff | “Request Journey Proposal,” “requesting your quote,” and “Personal quotation” coexist | Minor uncertainty about whether objects differ | Standardize on proposal/request terminology | NO | — |
| QA-001 | P2 | Accessibility assurance | Product | No configured a11y runner; 132 domain tests pass but do not cover focus, contrast or semantics | Regressions can ship unnoticed | Add targeted automated checks plus manual keyboard/SR/mobile release script after remediation | NO | SEC-014, PERF-015 |

## 25. Accessibility Findings Table

| WCAG 2.2 criterion (confidently applicable) | Severity | Surface | Evidence | Remediation direction |
|---|---|---|---|---|
| 1.4.3 Contrast (Minimum) | P1 | Small labels/hints/required markers | Computed 2.69–3.04:1 samples vs 4.5:1 requirement | AA-safe text tokens; remeasure all states |
| 1.4.10 Reflow | P1 | Builder step navigation | 663 px document width at 360 px viewport | Reflow or intentionally contained, labelled horizontal progress without page overflow |
| 2.1.1 Keyboard | P1 | Journey Studio destination order | Pointer drag is the only reorder mechanism | Keyboard move controls and position announcements |
| 4.1.2 Name, Role, Value | P1 | Choice cards, language chips, progress | Selected/current states are visual only | `aria-pressed`, `aria-current`, correct disabled state |
| 3.3.1 Error Identification / 3.3.3 Error Suggestion | P1 | Builder details | Error text exists but is off-screen and focus is unchanged | Visible/focused error summary linked to controls |
| 2.4.3 Focus Order / 2.4.11 Focus Not Obscured | P2 | Modal workflows | No trap, initial focus or restoration; proposal overlay lacks dialog role | Accessible dialog primitive and deterministic focus |
| 2.5.8 Target Size (Minimum) | P2 | Builder progress | Step controls measured ~32 px tall | Minimum 24 × 24 required; use 44 × 44 design target for touch |
| 2.4.8 Location (AA in WCAG 2.2) | P2 | Public/Admin navigation | Active links lack programmatic current state | Set `aria-current="page"` |
| 2.4.6 Headings and Labels | P2 | Transport route controls | Repeated “Transport preference” labels omit route context | Route-specific accessible labels |

## 26. Cross-Audit Correlation

- Audit 1 partial allocation/workflow writes mean UX success messages can overstate durable completion; batch transactional commands must precede staff sign-off.
- Audit 2 SEC-001/003/004 makes the role-filtered Admin and public supplier experience appear safer than the authorization/data exposure actually is. SEC-002 blocks trustworthy proposal acceptance.
- Audit 3 BIZ-001–005 means correct-looking dates, proposal status, payments and accepted totals can still be wrong or contradictory. These block real-money UAT independently of visual quality.
- Audit 4 PERF-001/002/015 means the premium UI has no verified clean production build, long-proposal performance budget or production observability. Slow-network/mobile UAT is incomplete.
- Audit 5 adds core interaction evidence rather than duplicating those findings: mobile reflow, validation recovery, programmatic state, contrast and keyboard ordering.

## 27. UAT Blockers

1. Correct UX-001, UX-002, A11Y-001, A11Y-002 and A11Y-003 before unassisted traveller/staff UAT.
2. Provide isolated test personas for Super Admin, Journey Designer, Partner Manager, Finance, Operations and Content, with disposable journeys/accounts.
3. Provide disposable V1/V2 proposal tokens and an email/WhatsApp delivery sandbox; do not use real traveller records.
4. Resolve SEC-001–004/011 and BIZ-001–005 before acceptance or money scenarios.
5. Obtain a clean production build and representative slow-network/long-proposal measurements (PERF-001/002/015).

## 28. Recommended UX Remediation Order

**P0:** None newly identified by this UX audit. Preserve the P0 technical remediation order from Audits 1–3.

**P1:** Builder mobile reflow and target size; validation focus/placement; selected/current state semantics; AA contrast tokens; keyboard-equivalent Studio route ordering.

**P2:** Accessible modal focus; route-specific labels; explicit resume/reset; Admin mobile navigation; long-proposal section navigation; current-page semantics; legal/privacy discovery; save-conflict UI; automated accessibility regression coverage.

**P3:** Standardize quote/proposal wording and polish non-critical state messaging.

**Future:** Screen-reader usability studies with international travellers, assisted family UAT, staff time-on-task benchmarking, localized copy/currency usability, and production Web Vitals/interaction monitoring.

## 29. FINAL LAUNCH READINESS SUMMARY

- **Traveller-facing product ready for UAT?** Ready only for supervised desktop exploratory UAT; **not ready** for unassisted/mobile acceptance UAT until the P1 Builder and accessibility findings are fixed.
- **Admin ready for staff UAT?** Static workflow structure is promising, but full staff UAT is **blocked by environment** and keyboard ordering; financial/role integrity findings prevent operational sign-off.
- **Proposal ready for traveller UAT?** Visual/content structure is ready for a controlled, disposable-token review; secure acceptance/revision UAT is **not ready** until SEC-002 and BIZ-003 are fixed and modal accessibility is corrected.
- **What blocks real-money testing?** SEC-001–004/011; BIZ-003–005/013/015; transactional/idempotency gaps; accepted-allocation divergence; lack of isolated finance fixtures.
- **What blocks public launch?** The preceding security/business blockers, mobile Builder failure, off-screen validation, core state/contrast/keyboard accessibility failures, unverified clean build and missing performance observability.
- **What can wait?** Proposal jump navigation, Admin mobile convenience, terminology polish, advanced localization, broader usability research and non-critical animation/card refinements.

AUDIT 5 COMPLETE – NO APPLICATION CODE, DATABASE, CONTENT OR STYLING CHANGES MADE
