import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";
import type { TierValue } from "@/lib/constants";

export interface ConsensusPick {
  tier: TierValue;
  voteCount: number;
}

/** Per-book, the most-picked tier across all submitted guest tier lists (ETC excluded). */
export async function getRoomConsensus(roomId: string): Promise<Record<string, ConsensusPick>> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("room_book_consensus")
    .select("room_book_id, tier, vote_count")
    .eq("room_id", roomId);

  if (error) throw error;

  const byBook = new Map<string, { tier: TierValue; vote_count: number }[]>();
  for (const row of data as { room_book_id: string; tier: TierValue; vote_count: number }[]) {
    const list = byBook.get(row.room_book_id) ?? [];
    list.push(row);
    byBook.set(row.room_book_id, list);
  }

  const result: Record<string, ConsensusPick> = {};
  for (const [bookId, rows] of byBook) {
    rows.sort((a, b) => b.vote_count - a.vote_count || a.tier.localeCompare(b.tier));
    result[bookId] = { tier: rows[0].tier, voteCount: rows[0].vote_count };
  }
  return result;
}
