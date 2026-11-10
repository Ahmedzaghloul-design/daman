-- Who wrote a comment / sent a receipt always comes from the session, never the browser.
create or replace function private.stamp_email()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_table_name = 'comments' then
    new.author_email := private.my_email();
    new.author_id := (select auth.uid());
  elsif tg_table_name = 'pending_receipts' then
    new.uploader_email := private.my_email();
    new.uploaded_by := (select auth.uid());
  end if;
  return new;
end $$;
revoke all on function private.stamp_email() from public, anon, authenticated;

create trigger comments_stamp before insert on public.comments
  for each row execute function private.stamp_email();
create trigger pending_stamp before insert on public.pending_receipts
  for each row execute function private.stamp_email();
