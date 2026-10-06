# StudyRecall

Personal spaced-repetition tracker. Add a topic + learned date → four reviews, each
scheduled from when you actually completed the previous one:

| Review | Scheduled on |
| --- | --- |
| R1 | learned date + 1 day |
| R2 | R1 completion date + 7 days |
| R3 | R2 completion date + 16 days |
| R4 | R3 completion date + 35 days |

The page has two columns:

- **Left: Todo**, a plain, undated checklist. Separate from the review system (own
  `todos` table, `lib/todos.ts`, `app/todoActions.ts`).
- **Right: StudyRecall**: add topics, a collapsible **Studied Today** list (topics logged
  today, with ✕ to delete), **Backlog** (missed) and **Today** reviews, and **All topics**.

Categories show as colored badges; each category keeps the same muted color everywhere.

Stack: Next.js (App Router, server actions) · TypeScript · Tailwind v4 · Supabase Postgres · Vercel.

## Setup

1. **Create a Supabase project** at https://supabase.com.
2. **Create the schema**: open *SQL Editor*, paste `supabase/schema.sql`, run it.
3. **Get credentials** from *Project Settings → API Keys*:
   - the project URL (`https://<ref>.supabase.co`)
   - a **secret key** (`sb_secret_...`). Create one under *Secret keys* if none exists.
     The legacy `anon` / `service_role` keys are not used.
4. **Configure env**: `cp .env.example .env.local` and set `SUPABASE_URL`,
   `SUPABASE_SECRET_KEY` and `APP_TIMEZONE` (IANA name, e.g. `America/New_York`).
5. `npm install && npm run dev` → http://localhost:3000
6. `npm test` runs the date/scheduling unit tests.

**Upgrading an existing database?** Run `supabase/migrations/002_todos.sql` in the SQL
editor to add the todo table.

**Upgrading from the fixed (+1/+7/+16/+35 from learned date) schedule?** Run
`npm run reschedule -- --dry-run` to preview, then `npm run reschedule` to recompute
existing topics' reviews. No SQL changes are needed.

Without `SUPABASE_URL` set, `npm run dev` runs in **demo mode** with in-memory sample
data (never in production).

## Deploy (Vercel)

1. Import the project into Vercel.
2. In *Settings → Environment Variables*, add `SUPABASE_URL`, `SUPABASE_SECRET_KEY`
   and `APP_TIMEZONE`. Don't put the secret key in any `NEXT_PUBLIC_*` variable.
3. Deploy.

> There's no login (by design). Anyone with the URL can use the app, so keep the URL
> private or turn on Vercel Deployment Protection.

## API keys

The browser never talks to Supabase. All database access happens in server
components / server actions through `lib/db.ts`, which imports `server-only` and uses
the secret key. No publishable key is needed. RLS is enabled with no policies, so a
publishable key couldn't read or write anything anyway.

## Design notes

- **Dynamic schedule** (`lib/schedule.ts`, pure + unit-tested). A review row exists only
  once its date is known: adding a topic creates R1; completing R*n* creates R*n+1* dated
  from the completion date (in `APP_TIMEZONE`). Late, on-time and early completions all
  shift what follows. Unticking R*n* removes the not-yet-done R*n+1*; unticking is blocked
  if a later review is already done.
- **No stored derived state.** Backlog/Today are computed from `scheduled_on`,
  today's date in `APP_TIMEZONE`, and `completed_at` (`lib/buckets.ts`).
  Backlog items completed today stay visible (crossed out) until tomorrow.
- **Dates** are `date` columns / `YYYY-MM-DD` strings; arithmetic is done in UTC so DST can't shift them.
  "Today" is resolved in `APP_TIMEZONE`.
- **No duplicates**: `unique (topic_id, review_number)`; new topic + R1 are inserted atomically
  in one Postgres function; follow-up reviews are inserted with `ON CONFLICT DO NOTHING`;
  the add button is disabled while submitting.
- **Delete** a topic from "All topics"; its reviews cascade.
