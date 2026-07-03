-- Book Tier-List App — Supabase/Postgres schema
-- Run this whole file once in the Supabase SQL editor on a fresh project.
-- All access from the app goes through the service-role key on the server;
-- RLS is enabled with no policies (deny-all) as defense-in-depth in case the
-- anon key ever leaks into client code.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type tier_value as enum ('S', 'A', 'B', 'C', 'D', 'F', 'ETC');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Room-owner accounts. Sign up with name + password only (no position here —
-- "position/직책" is entered per-room at room-creation time, see rooms.owner_position).
create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- Global, shared book catalog. Reused across rooms. Only title/author/cover
-- live here — synopsis/rating are room-specific (see room_books).
create table books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  cover_url text,
  created_at timestamptz not null default now()
);

-- A room = one tier-list "session" created by an owner.
create table rooms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  cover_url text,
  description text,
  owner_id uuid not null references users(id) on delete cascade,
  owner_position text not null,
  password_hash text, -- null = public room (listed on home page)
  is_deployed boolean not null default false,
  deployed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_rooms_owner_id on rooms(owner_id);
create index idx_rooms_public_deployed on rooms(is_deployed) where password_hash is null;

-- Which books belong to a room, plus room-specific synopsis/rating overrides.
-- Membership (which book_id rows exist) is locked once rooms.is_deployed = true;
-- synopsis/rating/display_order remain editable forever (see trigger below).
create table room_books (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  book_id uuid not null references books(id),
  synopsis text,
  rating numeric,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (room_id, book_id)
);

create index idx_room_books_room_id on room_books(room_id);

-- A guest identity within a room. (room_id, name, position) is the durable
-- identity — logging in again with the same combo resolves to the same row,
-- allowing the guest to re-edit their previously submitted tier list.
create table guests (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  name text not null,
  position text not null,
  created_at timestamptz not null default now(),
  unique (room_id, name, position)
);

create index idx_guests_room_id on guests(room_id);

-- One tier-list submission per guest per room.
create table tier_lists (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  guest_id uuid not null references guests(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, guest_id)
);

create index idx_tier_lists_room_id on tier_lists(room_id);

-- Per-book tier placement within a tier list. Absence of a row means the book
-- is still unplaced in the pool. A tier list is considered "submitted" (for
-- comment-permission purposes) once every room_book for that room has a row.
create table tier_list_entries (
  id uuid primary key default gen_random_uuid(),
  tier_list_id uuid not null references tier_lists(id) on delete cascade,
  room_book_id uuid not null references room_books(id) on delete cascade,
  tier tier_value not null,
  unique (tier_list_id, room_book_id)
);

create index idx_tier_list_entries_room_book_id on tier_list_entries(room_book_id);
create index idx_tier_list_entries_tier_list_id on tier_list_entries(tier_list_id);

-- Simple, add-only comments on a guest's tier-list submission. Only guests who
-- have themselves fully submitted a tier list in the same room may comment
-- (enforced in the app's data-access layer, not here).
create table comments (
  id uuid primary key default gen_random_uuid(),
  tier_list_id uuid not null references tier_lists(id) on delete cascade,
  author_guest_id uuid not null references guests(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_comments_tier_list_id on comments(tier_list_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: enabled everywhere, no policies (deny-all).
-- The app only ever talks to Postgres via the service-role key on the server,
-- which bypasses RLS entirely. This block exists purely as defense-in-depth.
-- ---------------------------------------------------------------------------

alter table users enable row level security;
alter table books enable row level security;
alter table rooms enable row level security;
alter table room_books enable row level security;
alter table guests enable row level security;
alter table tier_lists enable row level security;
alter table tier_list_entries enable row level security;
alter table comments enable row level security;

-- ---------------------------------------------------------------------------
-- Deploy lock: once a room is deployed, room_books membership (insert/delete,
-- or changing which book_id a row points to) is frozen. synopsis/rating/
-- display_order updates remain allowed forever, as does editing the shared
-- books row itself (title/author/cover_url) from within any room.
-- ---------------------------------------------------------------------------

create function prevent_room_books_membership_change_after_deploy()
returns trigger as $$
declare
  room_is_deployed boolean;
begin
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

create trigger trg_room_books_lock_after_deploy
  before insert or update or delete on room_books
  for each row execute function prevent_room_books_membership_change_after_deploy();

-- ---------------------------------------------------------------------------
-- 50-participant cap: atomic count+insert via RPC to avoid a TOCTOU race
-- under concurrent guest joins. Re-login with the same (room_id, name,
-- position) resolves to the existing row rather than counting as a new join.
-- ---------------------------------------------------------------------------

create function join_room_as_guest(
  p_room_id uuid,
  p_name text,
  p_position text
)
returns guests as $$
declare
  v_guest guests;
  v_count int;
begin
  perform pg_advisory_xact_lock(hashtext(p_room_id::text));

  select * into v_guest from guests
  where room_id = p_room_id and name = p_name and position = p_position;

  if found then
    return v_guest;
  end if;

  select count(*) into v_count from guests where room_id = p_room_id;

  if v_count >= 50 then
    raise exception 'room % has reached the 50-participant cap', p_room_id;
  end if;

  insert into guests (room_id, name, position)
  values (p_room_id, p_name, p_position)
  returning * into v_guest;

  return v_guest;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- Consensus view: per (room_book, tier) vote counts, excluding ETC picks.
-- The app picks the max-vote_count tier per room_book_id (DISTINCT ON),
-- tie-broken by tier enum order, rather than aggregating raw rows in JS.
-- ---------------------------------------------------------------------------

create view room_book_consensus as
select
  rb.id as room_book_id,
  rb.room_id,
  tle.tier,
  count(*) as vote_count
from room_books rb
join tier_list_entries tle on tle.room_book_id = rb.id
where tle.tier <> 'ETC'
group by rb.id, rb.room_id, tle.tier;
