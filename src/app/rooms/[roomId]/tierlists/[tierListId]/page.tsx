import { notFound } from "next/navigation";
import {
  getTierListDetail,
  getEntriesByTierListId,
  hasGuestFullySubmitted,
} from "@/lib/data/tierLists";
import { listRoomBooks } from "@/lib/data/roomBooks";
import { listComments } from "@/lib/data/comments";
import { getGuestSession } from "@/lib/auth/guest-session";
import { ReadOnlyTierBoard } from "@/components/room/read-only-tier-board";
import { CommentForm } from "./comment-form";

export default async function TierListDetailPage({
  params,
}: {
  params: Promise<{ roomId: string; tierListId: string }>;
}) {
  const { roomId, tierListId } = await params;
  const detail = await getTierListDetail(tierListId);
  if (!detail || detail.room_id !== roomId) {
    notFound();
  }

  const [books, entries, comments, guestSession] = await Promise.all([
    listRoomBooks(roomId),
    getEntriesByTierListId(tierListId),
    listComments(tierListId),
    getGuestSession(roomId),
  ]);

  let eligibilityMessage: string | null = null;
  if (!guestSession) {
    eligibilityMessage = "댓글을 남기려면 이 방에 게스트로 참여해주세요.";
  } else {
    const eligible = await hasGuestFullySubmitted(roomId, guestSession.guestId);
    if (!eligible) {
      eligibilityMessage = "댓글을 남기려면 먼저 이 방의 모든 책에 티어를 매겨 제출해주세요.";
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 p-6">
      <h1 className="text-xl font-semibold">
        {detail.guest.name} · {detail.guest.position}님의 티어리스트
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {new Date(detail.updated_at).toLocaleString("ko-KR")} 업데이트
      </p>

      <div className="mt-6">
        <ReadOnlyTierBoard books={books} entries={entries} />
      </div>

      <section className="mt-8 flex flex-col gap-3">
        <h2 className="text-base font-medium">댓글 ({comments.length})</h2>
        <ul className="flex flex-col gap-2">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">
                {c.author.name} · {c.author.position}
              </p>
              <p className="mt-1 text-muted-foreground">{c.content}</p>
            </li>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground">아직 댓글이 없어요.</p>
          )}
        </ul>
        <CommentForm roomId={roomId} tierListId={tierListId} eligibilityMessage={eligibilityMessage} />
      </section>
    </div>
  );
}
