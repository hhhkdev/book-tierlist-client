import { notFound } from "next/navigation";
import Link from "next/link";
import { getRoomById } from "@/lib/data/rooms";
import { getGuestSession } from "@/lib/auth/guest-session";
import { JoinForm } from "./join-form";
import { Button } from "@/components/ui/button";

export default async function JoinRoomPage({
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
    return (
      <div className="mx-auto w-full max-w-md flex-1 p-6">
        <h1 className="text-xl font-semibold">{room.title}</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          아직 배포되지 않은 방이에요. 방장이 배포한 뒤에 참여할 수 있어요.
        </p>
      </div>
    );
  }

  const guestSession = await getGuestSession(roomId);
  if (guestSession) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {guestSession.name} · {guestSession.position}(으)로 이미 참여하고 있어요.
        </p>
        <Link href={`/rooms/${roomId}/board`}>
          <Button>내 티어리스트로 이동</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <JoinForm roomId={roomId} roomTitle={room.title} />
    </div>
  );
}
