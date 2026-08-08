# Allocation Rate Editor Correction

Date: 2026-08-08

## Reported symptoms

- The primary guide displayed its saved rate, while accommodation, specialist guide, and transport allocations could fail to display matching plans.
- Typing an experience provider produced React's uncontrolled-to-controlled input warning.

## Root cause

Allocation scopes and their editor drafts are populated asynchronously. If an allocation key was edited before its complete draft existed, the update path created an object containing only the changed field. That partial object had no allocation `type`, so the saved-rate filter compared `pricing_plans.entity_type` with `undefined` and returned no results. The same missing defaults caused form values to change from `undefined` to strings, triggering the React warning.

## Correction

- Added one canonical `draftFromScope` initializer for accommodation, primary and specialist guides, vehicles, and experiences.
- The update path now restores a complete typed draft whenever a scope is edited before initialization finishes.
- All text, select, currency, status, and provider values in the affected rate editor now remain controlled from their first render.
- Saved rates continue to match strictly by both `entity_type` and the selected resource ID; no unrelated supplier rate can leak into another allocation.
- Added regression coverage for complete draft initialization, saved-rate matching, and controlled values.

## Live pricing-plan audit

The current Supabase data contains active saved plans for:

- Accommodation: Water Garden Sigiriya (BB, HB), The Kandy House (HB), Anuradhapura Heritage Villa (Per Person).
- Vehicle: Classic Island Tuk Tuk (per day).
- Guide: Ishara Wickramasinghe (Day package).
- Experiences: three experience records currently have active ticket/rate plans.

Consequently, selecting one of those exact resources should display its saved plan. Selecting another supplier with no attached active plan correctly presents the custom-service fields instead; a rate must first be added in that supplier's Admin editor if a reusable plan is desired.

## Verification

- TypeScript passed.
- Targeted lint passed.
- Full automated test suite passed: 63/63.
- Database audit was read-only; no pricing or supplier data was changed.
- No database migration is required.

