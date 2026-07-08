import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { DomainError } from "./errors";
import type { BookInput, BookRecord } from "./books";

export interface AdminRoomRecord {
  id: string;
  title: string;
  is_deployed: boolean;
  password_hash: string | null;
  created_at: string;
  owner: { id: string; name: string } | null;
}

export async function adminListRooms(): Promise<AdminRoomRecord[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, title, is_deployed, password_hash, created_at, owner:users(id, name)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as unknown as AdminRoomRecord[];
}

export async function adminDeleteRoom(roomId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("rooms").delete().eq("id", roomId);
  if (error) throw error;
}

export async function adminListBooks(query?: string): Promise<BookRecord[]> {
  const supabase = getSupabaseAdminClient();
  let builder = supabase
    .from("books")
    .select("id, title, author, cover_url, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const trimmed = query?.trim();
  if (trimmed) {
    const sanitized = trimmed.replace(/[,()."]/g, " ").trim();
    if (sanitized) {
      builder = builder.or(`title.ilike.%${sanitized}%,author.ilike.%${sanitized}%`);
    }
  }

  const { data, error } = await builder;
  if (error) throw error;
  return data;
}

export async function adminUpdateBook(bookId: string, input: BookInput): Promise<BookRecord> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("books")
    .update({ title: input.title, author: input.author, cover_url: input.coverUrl })
    .eq("id", bookId)
    .select("id, title, author, cover_url, created_at")
    .single();

  if (error) throw error;
  return data;
}

const POSTGRES_FOREIGN_KEY_VIOLATION = "23503";

export async function adminDeleteBook(bookId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("books").delete().eq("id", bookId);
  if (error) {
    if (error.code === POSTGRES_FOREIGN_KEY_VIOLATION) {
      throw new DomainError("이 책은 방에서 사용 중이라 삭제할 수 없습니다.");
    }
    throw error;
  }
}
