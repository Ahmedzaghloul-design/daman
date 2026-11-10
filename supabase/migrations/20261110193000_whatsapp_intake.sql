-- WhatsApp numbers an owner allows to send receipts into a workspace.
create table public.whatsapp_senders (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  phone text not null check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  label text not null default '' check (char_length(label) <= 80),
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  primary key (workspace_id, phone)
);
-- One number belongs to one workspace, so an incoming message has one home.
create unique index whatsapp_senders_phone_key on public.whatsapp_senders (phone);
create index whatsapp_senders_created_by_idx on public.whatsapp_senders (created_by);
alter table public.whatsapp_senders enable row level security;
create policy "members see numbers" on public.whatsapp_senders for select to authenticated
  using (private.role_in(workspace_id) is not null);
create policy "owner adds numbers" on public.whatsapp_senders for insert to authenticated
  with check (private.role_in(workspace_id) = 'owner' and created_by = (select auth.uid()));
create policy "owner removes numbers" on public.whatsapp_senders for delete to authenticated
  using (private.role_in(workspace_id) = 'owner');

-- Receipts can now arrive from the WhatsApp webhook (server, no user session).
alter table public.pending_receipts alter column uploaded_by drop not null;
alter table public.pending_receipts add column source text not null default 'app' check (source in ('app', 'whatsapp'));

-- Stamp identity from the session when there is one (app users). The server
-- (service role, no session) sets uploader_email itself for WhatsApp.
create or replace function private.stamp_email()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    if tg_table_name = 'pending_receipts' then new.source := 'whatsapp'; end if;
    return new;
  end if;
  if tg_table_name = 'comments' then
    new.author_email := private.my_email();
    new.author_id := (select auth.uid());
  elsif tg_table_name = 'pending_receipts' then
    new.uploader_email := private.my_email();
    new.uploaded_by := (select auth.uid());
    new.source := 'app';
  end if;
  return new;
end $$;
