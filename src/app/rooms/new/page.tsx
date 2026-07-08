import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { RoomForm } from "./room-form";

export default async function NewRoomPage() {
  const session = await getUserSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <RoomForm />
    </div>
  );
}
