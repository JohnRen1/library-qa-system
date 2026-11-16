create table if not exists public.quiz_records (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 60),
  phone text not null check (phone ~ '^1[3-9][0-9]{9}$'),
  score smallint not null default 0 check (score between 0 and 20),
  total_questions smallint not null default 20,
  wrong_count smallint not null default 0 check (wrong_count between 0 and 20),
  base_duration_seconds integer not null default 0 check (base_duration_seconds >= 0),
  penalty_seconds integer not null default 0 check (penalty_seconds >= 0),
  final_duration_seconds integer generated always as (base_duration_seconds + penalty_seconds) stored,
  submitted_at timestamptz not null default now()
);
create index if not exists quiz_records_final_duration_idx on public.quiz_records(final_duration_seconds, submitted_at);
alter table public.quiz_records enable row level security;
create policy "public can insert quiz records" on public.quiz_records for insert to anon with check (true);
create policy "authenticated can read quiz records" on public.quiz_records for select to authenticated using (true);
