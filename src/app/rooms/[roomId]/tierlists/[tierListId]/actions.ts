"use server";

import { revalidatePath } from "next/cache";
import { getGuestSession } from "@/lib/auth/guest-session";
import { addComment } from "@/lib/data/comments";
import { DomainError } from "@/lib/data/errors";

export interface CommentActionResult {
  error?: string;
}

export async function addCommentAction(
  roomId: string,
  tierListId: string,
  _prevState: CommentActionResult,
  formData: FormData
): Promise<CommentActionResult> {
  const session = await getGuestSession(roomId);
  if (!session) {
    return { error: "댓글을 남기려면 이 방에 게스트로 참여해주세요." };
  }

  const content = String(formData.get("content") ?? "");

  try {
    await addComment(roomId, tierListId, session.guestId, content);
  } catch (err) {
    if (err instanceof DomainError) {
      return { error: err.message };
    }
    throw err;
  }

  revalidatePath(`/rooms/${roomId}/tierlists/${tierListId}`);
  return {};
}
