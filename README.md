# StudyRecall

Personal spaced-repetition tracker. Add a topic + learned date → four reviews are
scheduled at **+1, +7, +16, +35 days** from the learned date. The home screen is a
todo list of **Backlog** (missed) and **Today**.

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

- **Schedule is immutable.** `reviews.scheduled_on` is written once at creation.
  Ticking/unticking only sets/clears `completed_at`; completing late never shifts later reviews.
- **No stored derived state.** Backlog/Today are computed from `scheduled_on`,
  today's date in `APP_TIMEZONE`, and `completed_at` (`lib/buckets.ts`).
  Backlog items completed today stay visible (crossed out) until tomorrow.
- **Dates** are `date` columns / `YYYY-MM-DD` strings; arithmetic is done in UTC so DST can't shift them.
  "Today" is resolved in `APP_TIMEZONE`.
- **No duplicates**: `unique (topic_id, review_number)`, topic+reviews inserted atomically
  in one Postgres function, and the add button is disabled while submitting.
- **Delete** a topic from "All topics"; its reviews cascade.
