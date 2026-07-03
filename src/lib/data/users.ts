import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { DomainError } from "./errors";

export interface UserRecord {
  id: string;
  name: string;
  created_at: string;
}

const POSTGRES_UNIQUE_VIOLATION = "23505";

export async function createUser(name: string, password: string): Promise<UserRecord> {
  const supabase = getSupabaseAdminClient();
  const passwordHash = await hashPassword(password);

  const { data, error } = await supabase
    .from("users")
    .insert({ name, password_hash: passwordHash })
    .select("id, name, created_at")
    .single();

  if (error) {
    if (error.code === POSTGRES_UNIQUE_VIOLATION) {
      throw new DomainError("이미 사용 중인 이름입니다.");
    }
    throw error;
  }

  return data;
}

/** Returns the authenticated user, or null if the name/password combo is invalid. */
export async function verifyUserCredentials(
  name: string,
  password: string
): Promise<UserRecord | null> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, name, created_at, password_hash")
    .eq("name", name)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const isValid = await verifyPassword(password, data.password_hash);
  if (!isValid) return null;

  return { id: data.id, name: data.name, created_at: data.created_at };
}
