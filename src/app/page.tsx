import Link from "next/link";
import { listPublicDeployedRooms } from "@/lib/data/rooms";

export default async function HomePage() {
  const rooms = await listPublicDeployedRooms();

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 p-6">
      <h1 className="text-xl font-semibold">열려있는 방</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        공개된 방에 들어가 참여자들의 책 티어리스트를 살펴보세요.
      </p>

      {rooms.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">아직 공개된 방이 없어요.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {rooms.map((room) => (
            <li key={room.id}>
              <Link
                href={`/rooms/${room.id}`}
                className="block overflow-hidden rounded-xl border border-border transition-colors hover:bg-accent"
              >
                {room.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={room.cover_url} alt="" className="h-32 w-full object-cover" />
                ) : (
                  <div className="h-32 w-full bg-muted" />
                )}
                <div className="p-4">
                  <p className="font-medium">{room.title}</p>
                  {room.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {room.description}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
