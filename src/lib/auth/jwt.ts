import "server-only";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set. See docs/SUPABASE.md.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession<T extends JWTPayload>(
  payload: T,
  expiresIn: string
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecretKey());
}

/** Any failure (expired, tampered, malformed) is treated as "no session", never thrown. */
export async function verifySession<T extends JWTPayload>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as T;
  } catch {
    return null;
  }
}
