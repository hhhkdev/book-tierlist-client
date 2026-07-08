import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { DomainError } from "./errors";
import { hasGuestFullySubmitted } from "./tierLists";

export interface CommentRecord {
  id: string;
  content: string;
  created_at: string;
  author: {
    id: string;
    name: string;
    position: string;
  };
}

export async function listComments(tierListId: string): Promise<CommentRecord[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("comments")
    .select("id, content, created_at, author:guests(id, name, position)")
    .eq("tier_list_id", tierListId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as unknown as CommentRecord[];
}

/**
 * Only guests who have themselves fully submitted a tier list in the same
 * room may comment — enforced here, not just in the UI.
 */
export async function addComment(
  roomId: string,
  tierListId: string,
  guestId: string,
  content: string
): Promise<CommentRecord> {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new DomainError("댓글 내용을 입력해주세요.");
  }

  const eligible = await hasGuestFullySubmitted(roomId, guestId);
  if (!eligible) {
    throw new DomainError("댓글을 남기려면 먼저 이 방의 모든 책에 티어를 매겨 제출해주세요.");
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("comments")
    .insert({ tier_list_id: tierListId, author_guest_id: guestId, content: trimmed })
    .select("id, content, created_at, author:guests(id, name, position)")
    .single();

  if (error) throw error;
  return data as unknown as CommentRecord;
}
