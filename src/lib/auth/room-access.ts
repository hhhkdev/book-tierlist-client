import "server-only";
import { cookies } from "next/headers";
import type { JWTPayload } from "jose";
import { signSession, verifySession } from "./jwt";

const EXPIRES_IN = "180d";
const MAX_AGE_SECONDS = 180 * 24 * 60 * 60;

interface RoomAccessPayload extends JWTPayload {
  roomId: string;
  verified: true;
}

function cookieName(roomId: string): string {
  return `room_access_${roomId}`;
}

/** Marks this browser as having passed the room's view-password gate. */
export async function grantRoomAccess(roomId: string): Promise<void> {
  const token = await signSession<RoomAccessPayload>({ roomId, verified: true }, EXPIRES_IN);
  const cookieStore = await cookies();
  cookieStore.set(cookieName(roomId), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function hasRoomAccess(roomId: string): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName(roomId))?.value;
  if (!token) return false;
  const payload = await verifySession<RoomAccessPayload>(token);
  return !!payload && payload.roomId === roomId && payload.verified === true;
}
