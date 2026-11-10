-- Phase 6 security review: grant only what the app uses (row-level security
-- still decides which rows), confirm email before joining a workspace, and
-- cap the size of an approved entry.
revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;

-- Visitors: only the consent-based demo request form.
grant insert on public.leads to anon, authenticated;

-- Signed-in users: only the operations the app performs (RLS limits rows/roles).
grant select, update (name, settings) on public.workspaces to authenticated;
grant select, update (role), delete on public.members to authenticated;
grant select, insert, delete on public.invitations to authenticated;
grant select, insert, update, delete on public.installations to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select on public.ledger_entries to authenticated;                 -- rows only via add_entry()
grant select, insert, delete on public.pending_receipts to authenticated;
grant select, insert on public.comments to authenticated;
grant select on public.access_log to authenticated;                     -- rows only via log_access()
grant select, insert, delete on public.whatsapp_senders to authenticated;

-- Join a workspace only with a confirmed email address.
create or replace function public.accept_invitations()
returns integer language plpgsql security definer set search_path = ''
as $$
declare n integer; em text := private.my_email();
begin
  if (select auth.uid()) is null or em = '' then return 0; end if;
  if not exists (select 1 from auth.users u where u.id = (select auth.uid()) and u.email_confirmed_at is not null) then return 0; end if;
  insert into public.members (workspace_id, user_id, email, role)
    select i.workspace_id, (select auth.uid()), em, i.role from public.invitations i
    where i.email = em and i.accepted_at is null
  on conflict (workspace_id, user_id) do nothing;
  update public.invitations set accepted_at = now() where email = em and accepted_at is null;
  get diagnostics n = row_count;
  return n;
end $$;

-- Approved entries: at most 50 kB of JSON.
create or replace function public.add_entry(p_ws uuid, p_entry jsonb)
returns text language plpgsql security definer set search_path = ''
as $$
declare seq integer; yr text; new_id text; em text := private.my_email();
begin
  if private.role_in(p_ws) not in ('owner', 'reviewer') then raise exception 'only owners and reviewers approve entries'; end if;
  if jsonb_typeof(p_entry) <> 'object' or length(p_entry::text) > 50000 then raise exception 'entry is not valid or too large'; end if;
  perform pg_advisory_xact_lock(hashtext('ledger:' || p_ws::text));
  select coalesce(max((regexp_match(id, '(\d+)$'))[1]::integer), 0) + 1 into seq from public.ledger_entries where workspace_id = p_ws;
  yr := coalesce(nullif(substring(p_entry ->> 'date' from '^\d{4}'), ''), to_char(now(), 'YYYY'));
  new_id := 'DMN-' || yr || '-' || lpad(seq::text, 4, '0');
  insert into public.ledger_entries (workspace_id, id, data, created_by)
    values (p_ws, new_id, p_entry || jsonb_build_object('id', new_id, 'reviewer', em, 'reviewedAt', to_jsonb(now())), (select auth.uid()));
  return new_id;
end $$;

create index if not exists workspaces_created_by_idx on public.workspaces (created_by);
