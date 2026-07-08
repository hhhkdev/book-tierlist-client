import "server-only";
import { cache } from "react";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { DomainError } from "./errors";

export interface RoomRecord {
  id: string;
  title: string;
  cover_url: string | null;
  description: string | null;
  owner_id: string;
  owner_position: string;
  password_hash: string | null;
  is_deployed: boolean;
  deployed_at: string | null;
  created_at: string;
}

export interface RoomInput {
  title: string;
  description: string | null;
  coverUrl: string | null;
  ownerPosition: string;
  password: string | null;
}

const ROOM_COLUMNS =
  "id, title, cover_url, description, owner_id, owner_position, password_hash, is_deployed, deployed_at, created_at";

export async function createRoom(ownerId: string, input: RoomInput): Promise<RoomRecord> {
  const supabase = getSupabaseAdminClient();
  const passwordHash = input.password ? await hashPassword(input.password) : null;

  const { data, error } = await supabase
    .from("rooms")
    .insert({
      title: input.title,
      description: input.description,
      cover_url: input.coverUrl,
      owner_id: ownerId,
      owner_position: input.ownerPosition,
      password_hash: passwordHash,
    })
    .select(ROOM_COLUMNS)
    .single();

  if (error) throw error;
  return data;
}

export const getRoomById = cache(async (roomId: string): Promise<RoomRecord | null> => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("rooms")
    .select(ROOM_COLUMNS)
    .eq("id", roomId)
    .maybeSingle();

  if (error) throw error;
  return data;
});

/** Throws if the room doesn't exist or isn't owned by ownerId — use for every owner-only mutation. */
export async function getRoomForOwner(roomId: string, ownerId: string): Promise<RoomRecord> {
  const room = await getRoomById(roomId);
  if (!room || room.owner_id !== ownerId) {
    throw new DomainError("방을 찾을 수 없거나 접근 권한이 없습니다.");
  }
  return room;
}

export async function listRoomsForOwner(ownerId: string): Promise<RoomRecord[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("rooms")
    .select(ROOM_COLUMNS)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/** Public (home page) listing: deployed rooms that aren't password-protected. */
export async function listPublicDeployedRooms(): Promise<RoomRecord[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("rooms")
    .select(ROOM_COLUMNS)
    .eq("is_deployed", true)
    .is("password_hash", null)
    .order("deployed_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function verifyRoomPassword(room: RoomRecord, password: string): Promise<boolean> {
  if (!room.password_hash) return true;
  return verifyPassword(password, room.password_hash);
}

export interface RoomSettingsInput {
  title: string;
  description: string | null;
  coverUrl: string | null;
  /** undefined = leave the room password unchanged, null = remove it, string = set a new one. */
  passwordUpdate?: string | null;
}

export async function updateRoomSettings(
  roomId: string,
  ownerId: string,
  input: RoomSettingsInput
): Promise<RoomRecord> {
  await getRoomForOwner(roomId, ownerId);
  const supabase = getSupabaseAdminClient();

  const patch: Record<string, unknown> = {
    title: input.title,
    description: input.description,
    cover_url: input.coverUrl,
  };

  if (input.passwordUpdate !== undefined) {
    patch.password_hash = input.passwordUpdate ? await hashPassword(input.passwordUpdate) : null;
  }

  const { data, error } = await supabase
    .from("rooms")
    .update(patch)
    .eq("id", roomId)
    .select(ROOM_COLUMNS)
    .single();

  if (error) throw error;
  return data;
}

/** Locks book-list membership permanently. Requires at least one book in the room. */
export async function deployRoom(roomId: string, ownerId: string): Promise<RoomRecord> {
  const room = await getRoomForOwner(roomId, ownerId);
  if (room.is_deployed) {
    throw new DomainError("이미 배포된 방입니다.");
  }

  const supabase = getSupabaseAdminClient();
  const { count, error: countError } = await supabase
    .from("room_books")
    .select("id", { count: "exact", head: true })
    .eq("room_id", roomId);

  if (countError) throw countError;
  if (!count || count === 0) {
    throw new DomainError("책을 한 권 이상 추가해야 배포할 수 있습니다.");
  }

  const { data, error } = await supabase
    .from("rooms")
    .update({ is_deployed: true, deployed_at: new Date().toISOString() })
    .eq("id", roomId)
    .select(ROOM_COLUMNS)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRoom(roomId: string, ownerId: string): Promise<void> {
  await getRoomForOwner(roomId, ownerId);
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("rooms").delete().eq("id", roomId);
  if (error) throw error;
}
