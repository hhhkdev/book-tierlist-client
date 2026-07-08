import { RANKED_TIER_VALUES } from "@/lib/constants";
import type { RoomBookRecord } from "@/lib/data/roomBooks";
import type { ConsensusPick } from "@/lib/data/consensus";

export function ConsensusBoard({
  books,
  consensus,
}: {
  books: RoomBookRecord[];
  consensus: Record<string, ConsensusPick>;
}) {
  const undecidedCount = books.filter((b) => !consensus[b.id]).length;

  return (
    <div className="flex flex-col gap-2">
      {RANKED_TIER_VALUES.map((tier) => {
        const tierBooks = books.filter((b) => consensus[b.id]?.tier === tier);
        return (
          <div key={tier} className="flex items-stretch gap-3 overflow-hidden rounded-lg border border-border">
            <div className="flex w-12 shrink-0 items-center justify-center bg-muted font-semibold">
              {tier}
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-2 p-2">
              {tierBooks.length === 0 ? (
                <span className="text-xs text-muted-foreground">-</span>
              ) : (
                tierBooks.map((b) => (
                  <div key={b.id} className="w-12" title={b.book.title}>
                    {b.book.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.book.cover_url}
                        alt=""
                        className="aspect-3/4 w-full rounded object-cover"
                      />
                    ) : (
                      <div className="aspect-3/4 w-full rounded bg-muted" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
      {undecidedCount > 0 && (
        <p className="text-xs text-muted-foreground">
          아직 아무도 티어를 매기지 않은 책 {undecidedCount}권이 있어요.
        </p>
      )}
    </div>
  );
}
