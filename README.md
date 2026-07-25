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
