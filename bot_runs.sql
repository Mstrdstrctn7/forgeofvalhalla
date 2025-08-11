create table if not exists public.bot_runs (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  tag text not null,
  ok boolean not null default false,
  payload jsonb,
  note text
);
alter table public.bot_runs enable row level security;
