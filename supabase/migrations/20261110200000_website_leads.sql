-- Demo requests from the website chatbot, only after the visitor ticks consent.
-- Insert-only for the public; reading is done by the team in the Supabase dashboard.
create table public.leads (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) <= 200 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  company text not null default '' check (char_length(company) <= 160),
  message text not null default '' check (char_length(message) <= 1500),
  lang text not null default 'en' check (lang in ('en', 'ar')),
  consent_text text not null check (char_length(consent_text) between 10 and 600),
  created_at timestamptz not null default now()
);
alter table public.leads enable row level security;
create policy "anyone can send a demo request" on public.leads for insert to anon, authenticated
  with check (true);
-- No select/update/delete policies: visitors cannot read leads back.
revoke select, update, delete on public.leads from anon, authenticated;
