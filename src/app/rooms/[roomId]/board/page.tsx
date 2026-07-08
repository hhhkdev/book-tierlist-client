import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getRoomById } from "@/lib/data/rooms";
import { getGuestSession } from "@/lib/auth/guest-session";
import { listRoomBooks } from "@/lib/data/roomBooks";
import { getMyTierListEntries } from "@/lib/data/tierLists";
import { TierBoard } from "@/components/tier-board/tier-board";
import { InfoTooltip } from "@/components/onboarding/info-tooltip";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const room = await getRoomById(roomId);
  if (!room) {
    notFound();
  }
  if (!room.is_deployed) {
    redirect(`/rooms/${roomId}`);
  }

  const guestSession = await getGuestSession(roomId);
  if (!guestSession) {
    redirect(`/rooms/${roomId}/join`);
  }

  const [books, entries] = await Promise.all([
    listRoomBooks(roomId),
    getMyTierListEntries(roomId, guestSession.guestId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4">
      <div>
        <div className="flex items-center gap-1.5">
          <h1 className="text-lg font-semibold">{room.title} — 내 티어리스트</h1>
          <InfoTooltip>
            S가 가장 높은 평가, F가 가장 낮은 평가예요. 읽지 않았거나 순위를 매기기 어려운 책은
            &ldquo;기타&rdquo;에 놓아주세요 — 기타로 분류된 책은 모두의 티어 집계에서 제외돼요.
          </InfoTooltip>
        </div>
        <p className="text-sm text-muted-foreground">
          {guestSession.name} · {guestSession.position}
        </p>
      </div>
      <TierBoard roomId={roomId} books={books} initialEntries={entries} />
    </div>
  );
}
