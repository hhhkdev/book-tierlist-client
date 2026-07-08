import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserSession } from "@/lib/auth/session";
import { listRoomsForOwner } from "@/lib/data/rooms";
import { Badge } from "@/components/ui/badge";

export default async function MyRoomsPage() {
  const session = await getUserSession();
  if (!session) {
    redirect("/login");
  }

  const rooms = await listRoomsForOwner(session.sub);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">내가 만든 방</h1>
        <Link href="/rooms/new" className="text-sm text-primary underline underline-offset-4">
          + 새 방 만들기
        </Link>
      </div>

      {rooms.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">아직 만든 방이 없어요.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {rooms.map((room) => (
            <li key={room.id}>
              <Link
                href={`/rooms/${room.id}/manage`}
                className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-accent"
              >
                <div>
                  <p className="text-sm font-medium">{room.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(room.created_at).toLocaleDateString("ko-KR")} 생성
                  </p>
                </div>
                <Badge variant={room.is_deployed ? "default" : "secondary"}>
                  {room.is_deployed ? "배포됨" : "준비중"}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
