import "server-only";
import { cookies } from "next/headers";
import type { JWTPayload } from "jose";
import { signSession, verifySession } from "./jwt";

const EXPIRES_IN = "180d";
const MAX_AGE_SECONDS = 180 * 24 * 60 * 60;

export interface GuestSessionPayload extends JWTPayload {
  guestId: string;
  roomId: string;
  name: string;
  position: string;
}

function cookieName(roomId: string): string {
  return `guest_${roomId}`;
}

/**
 * Per-room guest session cookie (one cookie per room, since a guest may hold
 * distinct name/position identities across different rooms). The cookie is a
 * convenience layer — the durable identity is always the (room_id, name,
 * position) tuple in the `guests` table, so callers should re-resolve via
 * that tuple on login rather than trusting the cookie's presence alone.
 */
export async function createGuestSession(payload: GuestSessionPayload): Promise<void> {
  const token = await signSession(payload, EXPIRES_IN);
  const cookieStore = await cookies();
  cookieStore.set(cookieName(payload.roomId), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // must survive top-level navigation from shared links (KakaoTalk, Slack, etc.)
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getGuestSession(roomId: string): Promise<GuestSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName(roomId))?.value;
  if (!token) return null;
  const payload = await verifySession<GuestSessionPayload>(token);
  if (!payload || payload.roomId !== roomId) return null;
  return payload;
}

export async function clearGuestSession(roomId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName(roomId));
}
