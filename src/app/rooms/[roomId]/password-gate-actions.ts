"use server";

import { getRoomById, verifyRoomPassword } from "@/lib/data/rooms";
import { grantRoomAccess } from "@/lib/auth/room-access";

export interface PasswordGateState {
  error?: string;
}

export async function verifyRoomPasswordAction(
  roomId: string,
  _prevState: PasswordGateState,
  formData: FormData
): Promise<PasswordGateState> {
  const room = await getRoomById(roomId);
  if (!room) {
    return { error: "방을 찾을 수 없습니다." };
  }

  const password = String(formData.get("password") ?? "");
  const isValid = await verifyRoomPassword(room, password);
  if (!isValid) {
    return { error: "비밀번호가 올바르지 않습니다." };
  }

  await grantRoomAccess(roomId);
  return {};
}
