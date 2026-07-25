# Roam Ceylon

A static, interactive trip-planning experience for tailor-made journeys around
Sri Lanka.

## Project structure

- `index.html` — page structure and accessible content
- `css/style.css` — design system and component styling
- `css/responsive.css` — responsive navigation and layout refinements
- `css/animations.css` — motion and reduced-motion behavior
- `js/state.js` — shared trip state and configuration
- `js/ui.js` — reusable rendering and media helpers
- `js/builder.js` — journey-builder interactions and pricing summary
- `js/app.js` — application bootstrap and site-wide behavior
- `data/` — travel and marketplace content
- `assets/` — local logo, hero, image, and icon assets

## Run locally

Serve the repository root with any static web server, for example:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Optional Supabase backend

The public site works without a backend and keeps its email enquiry fallback.
To enable persistence and the admin foundation:

1. Apply `supabase/schema.sql` to a Supabase project.
2. Copy `js/config.example.js` to the ignored `js/config.js` and set the project
   URL and anon key.
3. Load `js/config.js` before `js/backend.js` in `index.html` and
   `admin/index.html` during deployment.
4. Restrict authenticated admin access further with staff roles before launch.
