-- Daman: one workspace per factory; roles enforced by row-level security.
create type public.member_role as enum ('owner', 'reviewer', 'uploader', 'verifier');

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  settings jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  role public.member_role not null,
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index members_user_idx on public.members (user_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text not null check (email = lower(email) and position('@' in email) > 1),
  role public.member_role not null check (role <> 'owner'),
  invited_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (workspace_id, email)
);
create index invitations_email_idx on public.invitations (email);
create index invitations_invited_by_idx on public.invitations (invited_by);

create table public.installations (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 40),
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id)
);

create table public.products (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 40),
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id)
);

-- Append-only: rows are added only through add_entry(); no update/delete policies.
create table public.ledger_entries (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  id text not null,
  data jsonb not null,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  primary key (workspace_id, id)
);
create index ledger_created_by_idx on public.ledger_entries (created_by);

create table public.pending_receipts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  uploaded_by uuid not null default auth.uid() references auth.users (id),
  uploader_email text not null default '',
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index pending_ws_idx on public.pending_receipts (workspace_id);
create index pending_uploader_idx on public.pending_receipts (uploaded_by);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  entry_id text not null,
  author_id uuid not null default auth.uid() references auth.users (id),
  author_email text not null default '',
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  foreign key (workspace_id, entry_id) references public.ledger_entries (workspace_id, id) on delete cascade
);
create index comments_entry_idx on public.comments (workspace_id, entry_id);
create index comments_author_idx on public.comments (author_id);

create table public.access_log (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  action text not null check (char_length(action) between 1 and 60),
  target text not null default '' check (char_length(target) <= 120),
  created_at timestamptz not null default now()
);
create index access_log_ws_idx on public.access_log (workspace_id, created_at desc);
create index access_log_user_idx on public.access_log (user_id);

-- Role lookup in a schema the API does not expose.
create schema if not exists private;
grant usage on schema private to authenticated;
create or replace function private.role_in(ws uuid)
returns public.member_role
language sql stable security definer set search_path = ''
as $$
  select m.role from public.members m where m.workspace_id = ws and m.user_id = (select auth.uid())
$$;
revoke all on function private.role_in(uuid) from public, anon;
grant execute on function private.role_in(uuid) to authenticated;

create or replace function private.my_email()
returns text language sql stable set search_path = ''
as $$ select lower(coalesce((select auth.jwt()) ->> 'email', '')) $$;
grant execute on function private.my_email() to authenticated;

alter table public.workspaces enable row level security;
alter table public.members enable row level security;
alter table public.invitations enable row level security;
alter table public.installations enable row level security;
alter table public.products enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.pending_receipts enable row level security;
alter table public.comments enable row level security;
alter table public.access_log enable row level security;

-- workspaces
create policy "members read workspace" on public.workspaces for select to authenticated
  using (private.role_in(id) is not null);
create policy "owner/reviewer edit settings" on public.workspaces for update to authenticated
  using (private.role_in(id) in ('owner', 'reviewer')) with check (private.role_in(id) in ('owner', 'reviewer'));

-- members
create policy "members see team" on public.members for select to authenticated
  using (private.role_in(workspace_id) is not null);
create policy "owner changes roles" on public.members for update to authenticated
  using (private.role_in(workspace_id) = 'owner' and user_id <> (select auth.uid()))
  with check (private.role_in(workspace_id) = 'owner');
create policy "owner removes members" on public.members for delete to authenticated
  using (private.role_in(workspace_id) = 'owner' and user_id <> (select auth.uid()));

-- invitations
create policy "owner or invitee reads" on public.invitations for select to authenticated
  using (private.role_in(workspace_id) = 'owner' or email = private.my_email());
create policy "owner invites" on public.invitations for insert to authenticated
  with check (private.role_in(workspace_id) = 'owner' and invited_by = (select auth.uid()));
create policy "owner cancels" on public.invitations for delete to authenticated
  using (private.role_in(workspace_id) = 'owner');

-- installations / products: everyone in the workspace reads; owner + reviewer write
create policy "members read installations" on public.installations for select to authenticated
  using (private.role_in(workspace_id) is not null);
create policy "editors add installations" on public.installations for insert to authenticated
  with check (private.role_in(workspace_id) in ('owner', 'reviewer'));
create policy "editors change installations" on public.installations for update to authenticated
  using (private.role_in(workspace_id) in ('owner', 'reviewer')) with check (private.role_in(workspace_id) in ('owner', 'reviewer'));
create policy "editors delete installations" on public.installations for delete to authenticated
  using (private.role_in(workspace_id) in ('owner', 'reviewer'));

create policy "members read products" on public.products for select to authenticated
  using (private.role_in(workspace_id) is not null);
create policy "editors add products" on public.products for insert to authenticated
  with check (private.role_in(workspace_id) in ('owner', 'reviewer'));
create policy "editors change products" on public.products for update to authenticated
  using (private.role_in(workspace_id) in ('owner', 'reviewer')) with check (private.role_in(workspace_id) in ('owner', 'reviewer'));
create policy "editors delete products" on public.products for delete to authenticated
  using (private.role_in(workspace_id) in ('owner', 'reviewer'));

-- ledger: uploaders cannot read it
create policy "ledger readers" on public.ledger_entries for select to authenticated
  using (private.role_in(workspace_id) in ('owner', 'reviewer', 'verifier'));

-- pending receipts
create policy "send receipts" on public.pending_receipts for insert to authenticated
  with check (private.role_in(workspace_id) in ('owner', 'reviewer', 'uploader') and uploaded_by = (select auth.uid()));
create policy "reviewers or sender read" on public.pending_receipts for select to authenticated
  using (private.role_in(workspace_id) in ('owner', 'reviewer') or uploaded_by = (select auth.uid()));
create policy "reviewers clear" on public.pending_receipts for delete to authenticated
  using (private.role_in(workspace_id) in ('owner', 'reviewer'));

-- comments
create policy "comment readers" on public.comments for select to authenticated
  using (private.role_in(workspace_id) in ('owner', 'reviewer', 'verifier'));
create policy "comment writers" on public.comments for insert to authenticated
  with check (private.role_in(workspace_id) in ('owner', 'reviewer', 'verifier') and author_id = (select auth.uid()));

-- access log: owner reads; rows only via log_access()
create policy "owner reads log" on public.access_log for select to authenticated
  using (private.role_in(workspace_id) = 'owner');

-- RPCs ---------------------------------------------------------------------
create or replace function public.create_workspace(p_name text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare ws uuid; em text := private.my_email();
begin
  if (select auth.uid()) is null then raise exception 'not signed in'; end if;
  insert into public.workspaces (name, created_by) values (trim(p_name), (select auth.uid())) returning id into ws;
  insert into public.members (workspace_id, user_id, email, role) values (ws, (select auth.uid()), em, 'owner');
  return ws;
end $$;

create or replace function public.accept_invitations()
returns integer language plpgsql security definer set search_path = ''
as $$
declare n integer; em text := private.my_email();
begin
  if (select auth.uid()) is null or em = '' then return 0; end if;
  insert into public.members (workspace_id, user_id, email, role)
    select i.workspace_id, (select auth.uid()), em, i.role from public.invitations i
    where i.email = em and i.accepted_at is null
  on conflict (workspace_id, user_id) do nothing;
  update public.invitations set accepted_at = now() where email = em and accepted_at is null;
  get diagnostics n = row_count;
  return n;
end $$;

-- Sequential, never-reused IDs (DMN-<year>-<seq>); reviewer identity comes from the session.
create or replace function public.add_entry(p_ws uuid, p_entry jsonb)
returns text language plpgsql security definer set search_path = ''
as $$
declare seq integer; yr text; new_id text; em text := private.my_email();
begin
  if private.role_in(p_ws) not in ('owner', 'reviewer') then raise exception 'only owners and reviewers approve entries'; end if;
  perform pg_advisory_xact_lock(hashtext('ledger:' || p_ws::text));
  select coalesce(max((regexp_match(id, '(\d+)$'))[1]::integer), 0) + 1 into seq from public.ledger_entries where workspace_id = p_ws;
  yr := coalesce(nullif(substring(p_entry ->> 'date' from '^\d{4}'), ''), to_char(now(), 'YYYY'));
  new_id := 'DMN-' || yr || '-' || lpad(seq::text, 4, '0');
  insert into public.ledger_entries (workspace_id, id, data, created_by)
    values (p_ws, new_id, p_entry || jsonb_build_object('id', new_id, 'reviewer', em, 'reviewedAt', to_jsonb(now())), (select auth.uid()));
  return new_id;
end $$;

create or replace function public.log_access(p_ws uuid, p_action text, p_target text default '')
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if private.role_in(p_ws) is null then return; end if;
  insert into public.access_log (workspace_id, user_id, email, action, target)
    values (p_ws, (select auth.uid()), private.my_email(), left(p_action, 60), left(coalesce(p_target, ''), 120));
end $$;

revoke all on function public.create_workspace(text) from public, anon;
revoke all on function public.accept_invitations() from public, anon;
revoke all on function public.add_entry(uuid, jsonb) from public, anon;
revoke all on function public.log_access(uuid, text, text) from public, anon;
grant execute on function public.create_workspace(text) to authenticated;
grant execute on function public.accept_invitations() to authenticated;
grant execute on function public.add_entry(uuid, jsonb) to authenticated;
grant execute on function public.log_access(uuid, text, text) to authenticated;
