"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminSession, clearAdminSession } from "@/lib/auth/admin-session";
import { adminDeleteRoom, adminListBooks, adminUpdateBook, adminDeleteBook } from "@/lib/data/admin";
import { createBookSchema } from "@/lib/validation/books";
import { DomainError } from "@/lib/data/errors";
import type { BookRecord } from "@/lib/data/books";

export interface AdminActionResult {
  error?: string;
}

async function requireAdmin(): Promise<void> {
  const session = await getAdminSession();
  if (!session) {
    throw new DomainError("관리자 로그인이 필요합니다.");
  }
}

export async function logoutAdminAction(): Promise<void> {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function adminDeleteRoomAction(roomId: string): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    await adminDeleteRoom(roomId);
    revalidatePath("/admin/dashboard");
    return {};
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function adminSearchBooksAction(query: string): Promise<BookRecord[]> {
  const session = await getAdminSession();
  if (!session) return [];
  return adminListBooks(query);
}

export interface AdminBookActionResult extends AdminActionResult {
  book?: BookRecord;
}

export async function adminUpdateBookAction(
  bookId: string,
  formData: FormData
): Promise<AdminBookActionResult> {
  try {
    await requireAdmin();
    const parsed = createBookSchema.safeParse({
      title: formData.get("title"),
      author: formData.get("author"),
      coverUrl: formData.get("coverUrl"),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
    }
    const book = await adminUpdateBook(bookId, parsed.data);
    revalidatePath("/admin/dashboard");
    return { book };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function adminDeleteBookAction(bookId: string): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    await adminDeleteBook(bookId);
    revalidatePath("/admin/dashboard");
    return {};
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}
