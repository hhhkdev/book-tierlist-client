import Link from "next/link";
import { listRoomTierListSummaries } from "@/lib/data/tierLists";

export default async function RoomTierListsPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const summaries = await listRoomTierListSummaries(roomId);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 p-6">
      <h1 className="text-xl font-semibold">제출된 티어리스트 ({summaries.length}개)</h1>
      {summaries.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">아직 제출된 티어리스트가 없어요.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {summaries.map((s) => (
            <li key={s.id}>
              <Link
                href={`/rooms/${roomId}/tierlists/${s.id}`}
                className="block rounded-lg border border-border p-3 text-sm transition-colors hover:bg-accent"
              >
                <span className="font-medium">{s.guest.name}</span>
                <span className="text-muted-foreground"> · {s.guest.position}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
