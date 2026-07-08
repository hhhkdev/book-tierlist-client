import "server-only";
import { cookies } from "next/headers";
import type { JWTPayload } from "jose";
import { signSession, verifySession } from "./jwt";

const COOKIE_NAME = "admin_session";
const EXPIRES_IN = "12h";
const MAX_AGE_SECONDS = 12 * 60 * 60;

export interface AdminSessionPayload extends JWTPayload {
  role: "admin";
}

/** Single hardcoded admin credential, sourced from env vars — never from source/DB. */
export function verifyAdminCredentials(username: string, password: string): boolean {
  const expectedUsername = process.env.ADMIN_USERNAME ?? "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) return false;
  return username === expectedUsername && password === expectedPassword;
}

export async function createAdminSession(): Promise<void> {
  const token = await signSession<AdminSessionPayload>({ role: "admin" }, EXPIRES_IN);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession<AdminSessionPayload>(token);
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
