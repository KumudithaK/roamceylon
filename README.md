# Roam Ceylon

A Supabase-powered, interactive trip-planning experience for tailor-made
journeys around Sri Lanka.

## Project structure

- `index.html` — page structure and accessible content
- `css/style.css` — design system and component styling
- `css/responsive.css` — responsive navigation and layout refinements
- `css/animations.css` — motion and reduced-motion behavior
- `js/state.js` — shared trip state and configuration
- `js/repositories.js` — Supabase data access and UI-safe record mapping
- `js/services.js` — travel services and the reusable journey filtering engine
- `js/ui.js` — reusable rendering and media helpers
- `js/builder.js` — journey-builder interactions and pricing summary
- `js/app.js` — application bootstrap and site-wide behavior
- `data/` — source data retained for the protected one-time import
- `supabase/migrations/` — version-controlled database, RLS, and Storage setup
- `admin/` — protected content studio and email/password login
- `assets/` — local logo, hero, image, and icon assets

## Run locally

Configure Supabase using [SUPABASE_SETUP.md](SUPABASE_SETUP.md), then:

```sh
npm install
npm run dev
```

Vite prints the local URL. Run `npm test` and `npm run build` before release.

## Journey architecture

The builder follows this sequence:

`Themes → Destinations → Experiences → Accommodation → Transportation → Guide → Summary`

Relationships are stored in normalized join tables. `JourneyEngine` still
computes duplicate-free unions in memory, while repository classes keep
Supabase response shapes out of the UI. Public queries return only published,
active content.
