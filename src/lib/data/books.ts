import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";

export interface BookRecord {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  created_at: string;
}

export interface BookInput {
  title: string;
  author: string | null;
  coverUrl: string | null;
}

/** Strip characters that would break PostgREST's `or=(...)` filter syntax. */
function sanitizeForOrFilter(value: string): string {
  return value.replace(/[,()."]/g, " ").trim();
}

export async function searchGlobalBooks(query: string, limit = 20): Promise<BookRecord[]> {
  const supabase = getSupabaseAdminClient();
  let builder = supabase
    .from("books")
    .select("id, title, author, cover_url, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  const sanitized = sanitizeForOrFilter(query);
  if (sanitized) {
    builder = builder.or(`title.ilike.%${sanitized}%,author.ilike.%${sanitized}%`);
  }

  const { data, error } = await builder;
  if (error) throw error;
  return data;
}

export async function getBookById(bookId: string): Promise<BookRecord | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("books")
    .select("id, title, author, cover_url, created_at")
    .eq("id", bookId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createGlobalBook(input: BookInput): Promise<BookRecord> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("books")
    .insert({ title: input.title, author: input.author, cover_url: input.coverUrl })
    .select("id, title, author, cover_url, created_at")
    .single();

  if (error) throw error;
  return data;
}

/** Edits the shared book row itself (title/author/cover) — allowed at any time, from any room. */
export async function updateGlobalBook(bookId: string, input: BookInput): Promise<BookRecord> {
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

export async function deleteGlobalBook(bookId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("books").delete().eq("id", bookId);
  if (error) throw error;
}
