import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { getRoomForOwner } from "./rooms";
import { createGlobalBook, type BookInput, type BookRecord } from "./books";
import { DomainError } from "./errors";

export interface RoomBookRecord {
  id: string;
  room_id: string;
  book_id: string;
  synopsis: string | null;
  rating: number | null;
  display_order: number;
  created_at: string;
  book: BookRecord;
}

const ROOM_BOOK_COLUMNS =
  "id, room_id, book_id, synopsis, rating, display_order, created_at, book:books(id, title, author, cover_url, created_at)";

export async function listRoomBooks(roomId: string): Promise<RoomBookRecord[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("room_books")
    .select(ROOM_BOOK_COLUMNS)
    .eq("room_id", roomId)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data as unknown as RoomBookRecord[];
}

async function assertNotDeployed(roomId: string, ownerId: string) {
  const room = await getRoomForOwner(roomId, ownerId);
  if (room.is_deployed) {
    throw new DomainError("이미 배포된 방은 책 목록(멤버십)을 수정할 수 없습니다.");
  }
  return room;
}

async function nextDisplayOrder(roomId: string): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .from("room_books")
    .select("id", { count: "exact", head: true })
    .eq("room_id", roomId);
  if (error) throw error;
  return count ?? 0;
}

export interface RoomBookMeta {
  synopsis: string | null;
  rating: number | null;
}

/** Add a book already in the shared catalog to this (not-yet-deployed) room. */
export async function addExistingBookToRoom(
  roomId: string,
  ownerId: string,
  bookId: string,
  meta: RoomBookMeta
): Promise<RoomBookRecord> {
  await assertNotDeployed(roomId, ownerId);
  const supabase = getSupabaseAdminClient();
  const displayOrder = await nextDisplayOrder(roomId);

  const { data, error } = await supabase
    .from("room_books")
    .insert({
      room_id: roomId,
      book_id: bookId,
      synopsis: meta.synopsis,
      rating: meta.rating,
      display_order: displayOrder,
    })
    .select(ROOM_BOOK_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new DomainError("이미 이 방에 추가된 책입니다.");
    }
    throw error;
  }
  return data as unknown as RoomBookRecord;
}

/** Create a brand-new book in the shared catalog and add it to this room in one step. */
export async function addNewBookToRoom(
  roomId: string,
  ownerId: string,
  bookInput: BookInput,
  meta: RoomBookMeta
): Promise<RoomBookRecord> {
  await assertNotDeployed(roomId, ownerId);
  const book = await createGlobalBook(bookInput);
  return addExistingBookToRoom(roomId, ownerId, book.id, meta);
}

export async function removeRoomBook(
  roomId: string,
  ownerId: string,
  roomBookId: string
): Promise<void> {
  await assertNotDeployed(roomId, ownerId);
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("room_books")
    .delete()
    .eq("id", roomBookId)
    .eq("room_id", roomId);
  if (error) throw error;
}

/** synopsis/rating remain editable forever, even after deploy locks book membership. */
export async function updateRoomBookMeta(
  roomId: string,
  ownerId: string,
  roomBookId: string,
  meta: RoomBookMeta
): Promise<RoomBookRecord> {
  await getRoomForOwner(roomId, ownerId);
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("room_books")
    .update({ synopsis: meta.synopsis, rating: meta.rating })
    .eq("id", roomBookId)
    .eq("room_id", roomId)
    .select(ROOM_BOOK_COLUMNS)
    .single();

  if (error) throw error;
  return data as unknown as RoomBookRecord;
}
