import { redirect, notFound } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { getRoomById } from "@/lib/data/rooms";
import { listRoomBooks } from "@/lib/data/roomBooks";
import { listRoomTierListSummaries } from "@/lib/data/tierLists";
import { RoomSettingsForm } from "./room-settings-form";
import { BookListEditor } from "./book-list-editor";
import { DeploySection } from "./deploy-section";
import { TierListModeration } from "./tier-list-moderation";
import { DeleteRoomButton } from "./delete-room-button";
import { Separator } from "@/components/ui/separator";

export default async function ManageRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const session = await getUserSession();
  if (!session) {
    redirect("/login");
  }

  const room = await getRoomById(roomId);
  if (!room || room.owner_id !== session.sub) {
    notFound();
  }

  const [roomBooks, tierListSummaries] = await Promise.all([
    listRoomBooks(roomId),
    listRoomTierListSummaries(roomId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6">
      <div>
        <h1 className="text-xl font-semibold">{room.title} 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">방장만 볼 수 있는 페이지예요.</p>
      </div>

      <RoomSettingsForm room={room} />

      <Separator />

      <BookListEditor
        roomId={roomId}
        isDeployed={room.is_deployed}
        initialBooks={roomBooks}
      />

      <Separator />

      <DeploySection roomId={roomId} room={room} bookCount={roomBooks.length} />

      <Separator />

      <TierListModeration roomId={roomId} initialSummaries={tierListSummaries} />

      <Separator />

      <div className="flex justify-end">
        <DeleteRoomButton roomId={roomId} />
      </div>
    </div>
  );
}
