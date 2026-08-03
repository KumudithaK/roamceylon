# Roam Ceylon V2

Sri Lanka's premium intelligent travel platform and marketplace.

## Platform

- Next.js App Router, React and strict TypeScript
- Tailwind CSS design tokens with shadcn-style components
- Motion and Animate UI-inspired accessible motion primitives
- Supabase PostgreSQL, Auth and Storage
- React Hook Form and Zod
- Lucide icons and Embla galleries
- `next/image`, `next/font`, dynamic metadata and structured route architecture

## Run

```sh
cp .env.example .env.local
npm install
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.

## Routes

Public discovery, destination, experience, journey builder, marketplace,
editorial and legal content each have dedicated App Router routes. The
Supabase-backed content studio is available under `/admin`.

## Content

Supabase is the primary source of truth. The files in `data/` remain only as a
development fallback and guarded migration source. Database migrations and
setup instructions are in `supabase/` and `SUPABASE_SETUP.md`.

The validated V1 prototype is retained under `legacy-v1/` for historical
reference; it is not part of the V2 runtime.
