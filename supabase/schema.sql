-- StudyRecall schema. Run once in the Supabase SQL editor.

create table if not exists topics (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  learned_on  date not null,
  category    text,
  notes       text,
  created_at  timestamptz not null default now()
);

create table if not exists reviews (
  id            uuid primary key default gen_random_uuid(),
  topic_id      uuid not null references topics(id) on delete cascade,
  review_number smallint not null check (review_number between 1 and 4),
  scheduled_on  date not null,
  -- Completion state: null = not done. Kept separate from the schedule;
  -- completing/unticking never touches scheduled_on.
  completed_at  timestamptz,
  unique (topic_id, review_number) -- prevents duplicate reviews per topic
);

create index if not exists reviews_scheduled_on_idx on reviews (scheduled_on);

-- Creates a topic and its reviews atomically (no half-created topics).
-- Dates are computed by the app (lib/dates.ts) so offsets live in one place.
create or replace function create_topic_with_reviews(
  p_name text, p_learned_on date, p_category text, p_notes text, p_dates date[]
) returns uuid language plpgsql as $$
declare t_id uuid;
begin
  insert into topics (name, learned_on, category, notes)
  values (trim(p_name), p_learned_on, nullif(trim(p_category), ''), nullif(trim(p_notes), ''))
  returning id into t_id;

  insert into reviews (topic_id, review_number, scheduled_on)
  select t_id, n, d from unnest(p_dates) with ordinality as x(d, n)
  on conflict (topic_id, review_number) do nothing;

  return t_id;
end $$;

-- Lock everything down: the app talks to Postgres only server-side with the
-- secret API key (sb_secret_...). RLS with no policies means requests made with
-- a publishable key (Postgres roles anon/authenticated) can read or write nothing.
alter table topics  enable row level security;
alter table reviews enable row level security;
revoke execute on function create_topic_with_reviews from public, anon, authenticated;
