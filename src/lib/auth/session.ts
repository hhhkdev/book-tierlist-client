import "server-only";
import { cookies } from "next/headers";
import type { JWTPayload } from "jose";
import { signSession, verifySession } from "./jwt";

const COOKIE_NAME = "session";
const EXPIRES_IN = "30d";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export interface UserSessionPayload extends JWTPayload {
  sub: string;
  name: string;
}

/** Site-wide session for room-owner accounts. Set only from within a Server Action. */
export async function createUserSession(payload: UserSessionPayload): Promise<void> {
  const token = await signSession(payload, EXPIRES_IN);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getUserSession(): Promise<UserSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession<UserSessionPayload>(token);
}

export async function clearUserSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
