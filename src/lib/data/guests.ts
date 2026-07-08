import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { DomainError } from "./errors";

export interface GuestRecord {
  id: string;
  room_id: string;
  name: string;
  position: string;
  created_at: string;
}

/** Upserts-by-tuple via the join_room_as_guest RPC, which atomically enforces the 50-cap. */
export async function joinRoomAsGuest(
  roomId: string,
  name: string,
  position: string
): Promise<GuestRecord> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("join_room_as_guest", {
    p_room_id: roomId,
    p_name: name,
    p_position: position,
  });

  if (error) {
    if (error.message?.includes("50-participant cap")) {
      throw new DomainError("이 방은 이미 최대 인원(50명)에 도달했습니다.");
    }
    throw error;
  }
  return data as GuestRecord;
}
