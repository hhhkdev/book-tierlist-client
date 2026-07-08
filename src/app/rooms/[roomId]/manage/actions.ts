"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { updateRoomSettingsSchema } from "@/lib/validation/rooms";
import { createBookSchema } from "@/lib/validation/books";
import { updateRoomSettings, deployRoom, deleteRoom } from "@/lib/data/rooms";
import {
  addExistingBookToRoom,
  addNewBookToRoom,
  removeRoomBook,
  updateRoomBookMeta,
  type RoomBookRecord,
} from "@/lib/data/roomBooks";
import { searchGlobalBooks, type BookRecord } from "@/lib/data/books";
import { deleteTierList, listRoomTierListSummaries, type TierListSummary } from "@/lib/data/tierLists";
import { DomainError } from "@/lib/data/errors";

export interface ActionResult {
  error?: string;
  ok?: boolean;
}

async function requireUserId(): Promise<string> {
  const session = await getUserSession();
  if (!session) throw new DomainError("로그인이 필요합니다.");
  return session.sub;
}

function toResult(err: unknown): ActionResult {
  if (err instanceof DomainError) return { error: err.message };
  throw err;
}

export async function updateRoomSettingsAction(
  roomId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const ownerId = await requireUserId();
    const raw = {
      title: formData.get("title"),
      description: formData.get("description"),
      coverUrl: formData.get("coverUrl"),
      newPassword: formData.get("newPassword"),
      removePassword: formData.get("removePassword"),
    };
    const parsed = updateRoomSettingsSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
    }

    const passwordUpdate = parsed.data.removePassword
      ? null
      : parsed.data.newPassword !== null
        ? parsed.data.newPassword
        : undefined;

    await updateRoomSettings(roomId, ownerId, {
      title: parsed.data.title,
      description: parsed.data.description,
      coverUrl: parsed.data.coverUrl,
      passwordUpdate,
    });
    revalidatePath(`/rooms/${roomId}/manage`);
    return { ok: true };
  } catch (err) {
    return toResult(err);
  }
}

export async function searchBooksForRoomAction(query: string): Promise<BookRecord[]> {
  const session = await getUserSession();
  if (!session) return [];
  return searchGlobalBooks(query);
}

export interface AddBookResult extends ActionResult {
  roomBook?: RoomBookRecord;
}

export async function addExistingBookAction(
  roomId: string,
  bookId: string,
  synopsis: string,
  ratingRaw: string
): Promise<AddBookResult> {
  try {
    const ownerId = await requireUserId();
    const rating = ratingRaw.trim() ? Number(ratingRaw) : null;
    if (rating !== null && (Number.isNaN(rating) || rating < 0 || rating > 5)) {
      return { error: "평점은 0~5 사이 숫자여야 합니다." };
    }
    const roomBook = await addExistingBookToRoom(roomId, ownerId, bookId, {
      synopsis: synopsis.trim() || null,
      rating,
    });
    revalidatePath(`/rooms/${roomId}/manage`);
    return { ok: true, roomBook };
  } catch (err) {
    return toResult(err);
  }
}

export async function addNewBookAction(
  roomId: string,
  formData: FormData
): Promise<AddBookResult> {
  try {
    const ownerId = await requireUserId();
    const parsed = createBookSchema.safeParse({
      title: formData.get("title"),
      author: formData.get("author"),
      coverUrl: formData.get("coverUrl"),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
    }
    const ratingRaw = String(formData.get("rating") ?? "").trim();
    const rating = ratingRaw ? Number(ratingRaw) : null;
    if (rating !== null && (Number.isNaN(rating) || rating < 0 || rating > 5)) {
      return { error: "평점은 0~5 사이 숫자여야 합니다." };
    }
    const synopsis = String(formData.get("synopsis") ?? "").trim() || null;

    const roomBook = await addNewBookToRoom(roomId, ownerId, parsed.data, { synopsis, rating });
    revalidatePath(`/rooms/${roomId}/manage`);
    return { ok: true, roomBook };
  } catch (err) {
    return toResult(err);
  }
}

export async function removeBookAction(roomId: string, roomBookId: string): Promise<ActionResult> {
  try {
    const ownerId = await requireUserId();
    await removeRoomBook(roomId, ownerId, roomBookId);
    revalidatePath(`/rooms/${roomId}/manage`);
    return { ok: true };
  } catch (err) {
    return toResult(err);
  }
}

export async function updateBookMetaAction(
  roomId: string,
  roomBookId: string,
  synopsis: string,
  ratingRaw: string
): Promise<ActionResult> {
  try {
    const ownerId = await requireUserId();
    const rating = ratingRaw.trim() ? Number(ratingRaw) : null;
    if (rating !== null && (Number.isNaN(rating) || rating < 0 || rating > 5)) {
      return { error: "평점은 0~5 사이 숫자여야 합니다." };
    }
    await updateRoomBookMeta(roomId, ownerId, roomBookId, {
      synopsis: synopsis.trim() || null,
      rating,
    });
    revalidatePath(`/rooms/${roomId}/manage`);
    return { ok: true };
  } catch (err) {
    return toResult(err);
  }
}

export async function deployRoomAction(roomId: string): Promise<ActionResult> {
  try {
    const ownerId = await requireUserId();
    await deployRoom(roomId, ownerId);
    revalidatePath(`/rooms/${roomId}/manage`);
    return { ok: true };
  } catch (err) {
    return toResult(err);
  }
}

export async function deleteRoomAction(roomId: string): Promise<void> {
  const ownerId = await requireUserId();
  await deleteRoom(roomId, ownerId);
  redirect("/rooms/mine");
}

export async function listSubmittedTierListsAction(roomId: string): Promise<TierListSummary[]> {
  await requireUserId();
  return listRoomTierListSummaries(roomId);
}

export async function deleteTierListAction(roomId: string, tierListId: string): Promise<ActionResult> {
  try {
    const ownerId = await requireUserId();
    await deleteTierList(roomId, ownerId, tierListId);
    revalidatePath(`/rooms/${roomId}/manage`);
    return { ok: true };
  } catch (err) {
    return toResult(err);
  }
}
