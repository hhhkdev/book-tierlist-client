"use server";

import { getGuestSession } from "@/lib/auth/guest-session";
import { setTierPlacement } from "@/lib/data/tierLists";
import { DomainError } from "@/lib/data/errors";
import type { TierValue } from "@/lib/constants";

export interface BoardActionResult {
  error?: string;
}

export async function setTierPlacementAction(
  roomId: string,
  roomBookId: string,
  tier: TierValue | null
): Promise<BoardActionResult> {
  const session = await getGuestSession(roomId);
  if (!session) {
    return { error: "게스트 로그인이 필요합니다." };
  }

  try {
    await setTierPlacement(roomId, session.guestId, roomBookId, tier);
    return {};
  } catch (err) {
    if (err instanceof DomainError) {
      return { error: err.message };
    }
    throw err;
  }
}
