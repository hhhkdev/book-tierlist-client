import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { getRoomById } from "@/lib/data/rooms";
import { getUserSession } from "@/lib/auth/session";
import { listRoomBooks } from "@/lib/data/roomBooks";
import { getRoomConsensus } from "@/lib/data/consensus";
import { BookGalleryGrid } from "@/components/room/book-gallery-grid";
import { ConsensusBoard } from "@/components/room/consensus-board";
import { ShareLinkButton } from "@/components/room/share-link-button";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const room = await getRoomById(roomId);
  if (!room) {
    notFound();
  }

  const session = await getUserSession();
  const isOwner = session?.sub === room.owner_id;

  if (!room.is_deployed && !isOwner) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 p-6">
        <h1 className="text-xl font-semibold">{room.title}</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          방장이 아직 준비 중인 방이에요. 배포되면 다시 방문해주세요.
        </p>
      </div>
    );
  }

  const [books, consensus, headerList] = await Promise.all([
    listRoomBooks(roomId),
    room.is_deployed ? getRoomConsensus(roomId) : Promise.resolve({}),
    headers(),
  ]);

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  const roomUrl = host ? `${protocol}://${host}/rooms/${roomId}` : `/rooms/${roomId}`;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 p-6">
      {room.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={room.cover_url} alt="" className="mb-4 h-40 w-full rounded-xl object-cover" />
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{room.title}</h1>
          {room.description && (
            <p className="mt-1 text-sm text-muted-foreground">{room.description}</p>
          )}
        </div>
        <ShareLinkButton url={roomUrl} title={room.title} />
      </div>

      {!room.is_deployed && isOwner && (
        <p className="mt-3 text-xs text-muted-foreground">
          아직 배포 전이라 게스트에게는 준비중 화면만 보여요. (방장에게만 미리보기가 표시됩니다)
        </p>
      )}

      <div className="mt-6 flex items-center gap-2">
        <Link href={`/rooms/${roomId}/join`}>
          <Button>게스트로 참여하기</Button>
        </Link>
        <Link
          href={`/rooms/${roomId}/tierlists`}
          className="text-sm text-primary underline underline-offset-4"
        >
          제출된 티어리스트 모아보기
        </Link>
      </div>

      <Separator className="my-8" />

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium">모두의 티어 (집계)</h2>
        {books.length === 0 ? (
          <p className="text-sm text-muted-foreground">아직 등록된 책이 없어요.</p>
        ) : (
          <ConsensusBoard books={books} consensus={consensus} />
        )}
      </section>

      <Separator className="my-8" />

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium">책 목록 ({books.length}권)</h2>
        <BookGalleryGrid books={books} />
      </section>
    </div>
  );
}
