-- Adds the standalone todo list. Independent of topics/reviews.
create table if not exists todos (
  id           uuid primary key default gen_random_uuid(),
  text         text not null check (length(trim(text)) > 0),
  completed_at timestamptz, -- null = not done
  created_at   timestamptz not null default now()
);

alter table todos enable row level security;
