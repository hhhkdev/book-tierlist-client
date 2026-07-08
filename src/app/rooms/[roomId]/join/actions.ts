"use server";

import { redirect } from "next/navigation";
import { guestLoginSchema } from "@/lib/validation/auth";
import { getRoomById } from "@/lib/data/rooms";
import { joinRoomAsGuest } from "@/lib/data/guests";
import { createGuestSession } from "@/lib/auth/guest-session";
import { DomainError } from "@/lib/data/errors";

export interface GuestJoinState {
  error?: string;
}

export async function joinRoomAction(
  roomId: string,
  _prevState: GuestJoinState,
  formData: FormData
): Promise<GuestJoinState> {
  const room = await getRoomById(roomId);
  if (!room) {
    return { error: "방을 찾을 수 없습니다." };
  }
  if (!room.is_deployed) {
    return { error: "아직 배포되지 않은 방이에요. 방장이 배포한 뒤에 참여할 수 있어요." };
  }

  const parsed = guestLoginSchema.safeParse({
    name: formData.get("name"),
    position: formData.get("position"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  try {
    const guest = await joinRoomAsGuest(roomId, parsed.data.name, parsed.data.position);
    await createGuestSession({
      guestId: guest.id,
      roomId,
      name: guest.name,
      position: guest.position,
    });
  } catch (err) {
    if (err instanceof DomainError) {
      return { error: err.message };
    }
    throw err;
  }

  redirect(`/rooms/${roomId}/board`);
}
