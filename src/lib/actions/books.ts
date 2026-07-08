"use server";

import { getUserSession } from "@/lib/auth/session";
import { createBookSchema } from "@/lib/validation/books";
import { searchGlobalBooks, createGlobalBook, type BookRecord } from "@/lib/data/books";

export interface CreateBookActionState {
  error?: string;
  book?: BookRecord;
}

export async function searchBooksAction(query: string): Promise<BookRecord[]> {
  const session = await getUserSession();
  if (!session) return [];
  return searchGlobalBooks(query);
}

export async function createBookAction(
  _prevState: CreateBookActionState,
  formData: FormData
): Promise<CreateBookActionState> {
  const session = await getUserSession();
  if (!session) {
    return { error: "로그인이 필요합니다." };
  }

  const parsed = createBookSchema.safeParse({
    title: formData.get("title"),
    author: formData.get("author"),
    coverUrl: formData.get("coverUrl"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const book = await createGlobalBook(parsed.data);
  return { book };
}
