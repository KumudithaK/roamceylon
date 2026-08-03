# Supabase setup

This project uses Supabase for traveller-facing content, staff authentication,
partner applications, and managed travel photography.

## 1. Project and environment

The current project URL is:

```text
https://fstpfqlgypvktjwdeagu.supabase.co
```

Copy `.env.example` to `.env.local` and set:

```sh
NEXT_PUBLIC_SUPABASE_URL=https://fstpfqlgypvktjwdeagu.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-project-publishable-key
```

Find the publishable key in **Supabase Dashboard → Project Settings → API**.
Only the URL and publishable key belong in the browser. Never put a database
password or service-role key in a `NEXT_PUBLIC_` variable.

Install dependencies and run the app:

```sh
npm install
npm run dev
```

Open the URL printed by Vite. The staff login is at `/admin/login/`.

## 2. Apply the database migration

Install and authenticate the Supabase CLI, then link the repository:

```sh
supabase login
supabase link --project-ref fstpfqlgypvktjwdeagu
supabase db push
```

The canonical schema is
`supabase/migrations/`. The ordered migrations create the core marketplace,
review workflow, complete CMS fields, homepage/settings records, enquiries,
constraints, indexes, triggers, RLS policies, and the public `travel-content`
bucket.

Alternatively, paste that migration into the Supabase SQL Editor and run it
once. Do not run the import before the migration.

## 3. Create the first administrator

There is deliberately no public staff sign-up.

1. In **Authentication → Users**, create a user with email and password.
2. Copy the new user's UUID.
3. Run the following in the SQL Editor, replacing the values:

```sql
insert into public.profiles (id, email, full_name, role)
values (
  '86d04378-e579-43a4-9012-18b8d0abb7a8',
  'kumuditha.info@gmail.com',
  'Roam Ceylon Administrator',
  'admin'
)
on conflict (id) do update
set role = 'admin',
    email = excluded.email,
    full_name = excluded.full_name;
```

Create editors in the same way with `role = 'editor'`. Editors can read,
create, and update content, but only administrators can delete content, manage
profiles, review partner applications, or convert approved applications.

## 4. Storage

The migration creates the public `travel-content` bucket with a 10 MB limit
and JPEG, PNG, WebP, and AVIF MIME types. The admin uploads to:

- `themes/`
- `destinations/`
- `experiences/`
- `accommodations/`
- `vehicles/`
- `guides/`
- `partners/`

Public reads are allowed. Upload, replacement, and deletion require an
authenticated `admin` or `editor` profile. If the bucket was removed manually,
re-run only the bucket `insert ... on conflict` and storage policies from the
migration.

## 5. Import the existing JSON once

The browser never receives the service-role key. It is used only by the local,
one-time import process:

```sh
SUPABASE_URL=https://fstpfqlgypvktjwdeagu.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-temporary-service-role-key \
npm run import:data
```

The importer is explicitly guarded by `--confirm-import` in the npm script and
upserts normalized slugs, so rerunning it does not duplicate content. It
rebuilds theme/destination and destination/experience relationships. Suspect or
reused experience images remain blank and those records remain drafts for
manual correction. Legacy stay, vehicle and guide records are imported only as
unverified draft samples and can never be published until replaced with real
partner data. The importer removes generated copy, limits card descriptions to
160 characters, does not infer seasonal priority, and records quality flags.
Its latest report is written to `reports/latest-import-report.json` and stored
in the admin-only `content_import_runs` table.

After pulling new migrations, always preview and apply them before importing:

```sh
npx supabase db push --dry-run
npx supabase db push
```

After a successful import, unset the service-role key from the shell. Never add
it to `.env.local`, source control, frontend code, or a client-side deployment.

## 6. Validate RLS

Use a private browser window or the SQL Editor with role/JWT simulation:

1. As an anonymous visitor, query published/active content and confirm it is
   returned.
2. Mark a test record `draft` and confirm anonymous reads do not return it.
3. Confirm anonymous insert/update/delete attempts on content fail.
4. Confirm anonymous partner application insertion succeeds only with
   `status = 'pending'`.
5. Sign in as an editor and confirm select/insert/update work while content
   deletion and application review fail.
6. Sign in as an admin and create, publish, unpublish, duplicate, and delete a
   test experience.
7. Upload and replace its image, then confirm the public card reflects the
   saved URL and alt text.
8. Confirm partner applications are not readable publicly and that only an
   admin can approve and convert one to a draft marketplace listing.

The migration enforces image URL and alt text for published records at the
database level as well as in the admin UI.

## 7. Local verification and deployment

```sh
npm test
npm run build
npm run preview
```

Set the same two `NEXT_PUBLIC_` variables in the production hosting environment before
building. Keep the service-role key out of that environment.
