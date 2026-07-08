import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { getRoomForOwner } from "./rooms";
import { DomainError } from "./errors";
import type { TierValue } from "@/lib/constants";

export interface TierListSummary {
  id: string;
  updated_at: string;
  guest: {
    id: string;
    name: string;
    position: string;
  };
}

async function getOrCreateTierList(roomId: string, guestId: string): Promise<{ id: string }> {
  const supabase = getSupabaseAdminClient();
  const { data: existing, error: selectError } = await supabase
    .from("tier_lists")
    .select("id")
    .eq("room_id", roomId)
    .eq("guest_id", guestId)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from("tier_lists")
    .insert({ room_id: roomId, guest_id: guestId })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: retry, error: retryError } = await supabase
        .from("tier_lists")
        .select("id")
        .eq("room_id", roomId)
        .eq("guest_id", guestId)
        .single();
      if (retryError) throw retryError;
      return retry;
    }
    throw error;
  }
  return data;
}

/** This guest's current book -> tier placements for the room (missing = still in the pool). */
export async function getMyTierListEntries(
  roomId: string,
  guestId: string
): Promise<Record<string, TierValue>> {
  const supabase = getSupabaseAdminClient();
  const { data: tierList, error: tierListError } = await supabase
    .from("tier_lists")
    .select("id")
    .eq("room_id", roomId)
    .eq("guest_id", guestId)
    .maybeSingle();

  if (tierListError) throw tierListError;
  if (!tierList) return {};

  const { data, error } = await supabase
    .from("tier_list_entries")
    .select("room_book_id, tier")
    .eq("tier_list_id", tierList.id);

  if (error) throw error;

  const entries: Record<string, TierValue> = {};
  for (const row of data as { room_book_id: string; tier: TierValue }[]) {
    entries[row.room_book_id] = row.tier;
  }
  return entries;
}

/** tier === null moves the book back to the unsorted pool (deletes its entry row). */
export async function setTierPlacement(
  roomId: string,
  guestId: string,
  roomBookId: string,
  tier: TierValue | null
): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { data: roomBook, error: roomBookError } = await supabase
    .from("room_books")
    .select("id")
    .eq("id", roomBookId)
    .eq("room_id", roomId)
    .maybeSingle();

  if (roomBookError) throw roomBookError;
  if (!roomBook) throw new DomainError("이 방에 속하지 않은 책입니다.");

  const tierList = await getOrCreateTierList(roomId, guestId);

  if (tier === null) {
    const { error } = await supabase
      .from("tier_list_entries")
      .delete()
      .eq("tier_list_id", tierList.id)
      .eq("room_book_id", roomBookId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("tier_list_entries")
      .upsert(
        { tier_list_id: tierList.id, room_book_id: roomBookId, tier },
        { onConflict: "tier_list_id,room_book_id" }
      );
    if (error) throw error;
  }

  await supabase
    .from("tier_lists")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", tierList.id);
}

/** Room-owner moderation view: who has submitted a tier list in this room. */
export async function listRoomTierListSummaries(roomId: string): Promise<TierListSummary[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("tier_lists")
    .select("id, updated_at, guest:guests(id, name, position)")
    .eq("room_id", roomId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data as unknown as TierListSummary[];
}

/** Room owner deletes a guest's submission (e.g. bad-faith entry). Cascades to entries/comments. */
export async function deleteTierList(
  roomId: string,
  ownerId: string,
  tierListId: string
): Promise<void> {
  await getRoomForOwner(roomId, ownerId);
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("tier_lists")
    .delete()
    .eq("id", tierListId)
    .eq("room_id", roomId);
  if (error) throw error;
}

export interface TierListDetail {
  id: string;
  room_id: string;
  updated_at: string;
  guest: {
    id: string;
    name: string;
    position: string;
  };
}

export async function getTierListDetail(tierListId: string): Promise<TierListDetail | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("tier_lists")
    .select("id, room_id, updated_at, guest:guests(id, name, position)")
    .eq("id", tierListId)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as TierListDetail | null;
}

export async function getEntriesByTierListId(
  tierListId: string
): Promise<Record<string, TierValue>> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("tier_list_entries")
    .select("room_book_id, tier")
    .eq("tier_list_id", tierListId);

  if (error) throw error;

  const entries: Record<string, TierValue> = {};
  for (const row of data as { room_book_id: string; tier: TierValue }[]) {
    entries[row.room_book_id] = row.tier;
  }
  return entries;
}

/** "제출" = this guest has placed every book in the room's list into some tier (ETC included). */
export async function hasGuestFullySubmitted(roomId: string, guestId: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  const { data: tierList, error: tierListError } = await supabase
    .from("tier_lists")
    .select("id")
    .eq("room_id", roomId)
    .eq("guest_id", guestId)
    .maybeSingle();

  if (tierListError) throw tierListError;
  if (!tierList) return false;

  const { count: bookCount, error: bookCountError } = await supabase
    .from("room_books")
    .select("id", { count: "exact", head: true })
    .eq("room_id", roomId);
  if (bookCountError) throw bookCountError;
  if (!bookCount) return false;

  const { count: entryCount, error: entryCountError } = await supabase
    .from("tier_list_entries")
    .select("id", { count: "exact", head: true })
    .eq("tier_list_id", tierList.id);
  if (entryCountError) throw entryCountError;

  return entryCount === bookCount;
}
