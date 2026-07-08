-- Fix: deleting a deployed room used to fail, because the deploy-lock trigger
-- on room_books also blocked the ON DELETE CASCADE fired by deleting the
-- parent room row (Postgres runs the child's BEFORE DELETE trigger during
-- that cascade too). pg_trigger_depth() > 1 identifies "this delete is part
-- of a cascade" and lets it through; direct mutation of room_books while the
-- room is still deployed remains blocked as before.
--
-- Safe to run against an existing database — CREATE OR REPLACE FUNCTION just
-- updates the trigger's logic in place, no data is touched.

create or replace function prevent_room_books_membership_change_after_deploy()
returns trigger as $$
declare
  room_is_deployed boolean;
begin
  if pg_trigger_depth() > 1 then
    return coalesce(new, old);
  end if;

  select is_deployed into room_is_deployed
  from rooms
  where id = coalesce(new.room_id, old.room_id);

  if not room_is_deployed then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' or tg_op = 'DELETE' then
    raise exception 'room_books membership is locked: room % is already deployed', coalesce(new.room_id, old.room_id);
  end if;

  if tg_op = 'UPDATE' and new.book_id <> old.book_id then
    raise exception 'room_books membership is locked: room % is already deployed', old.room_id;
  end if;

  return new;
end;
$$ language plpgsql;
