import { notFound } from "next/navigation";
import { getRoomById } from "@/lib/data/rooms";
import { getUserSession } from "@/lib/auth/session";
import { hasRoomAccess } from "@/lib/auth/room-access";
import { PasswordGateForm } from "./password-gate-form";

export default async function RoomLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const room = await getRoomById(roomId);
  if (!room) {
    notFound();
  }

  const session = await getUserSession();
  const isOwner = session?.sub === room.owner_id;

  if (room.password_hash && !isOwner) {
    const access = await hasRoomAccess(roomId);
    if (!access) {
      return <PasswordGateForm roomId={roomId} roomTitle={room.title} />;
    }
  }

  return <>{children}</>;
}
