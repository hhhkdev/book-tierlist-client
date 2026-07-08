import { TIER_VALUES, type TierValue } from "@/lib/constants";
import type { RoomBookRecord } from "@/lib/data/roomBooks";
import { TIER_LABELS, TIER_COLORS } from "@/components/tier-board/tier-visuals";

export function ReadOnlyTierBoard({
  books,
  entries,
}: {
  books: RoomBookRecord[];
  entries: Record<string, TierValue>;
}) {
  return (
    <div className="flex flex-col gap-2">
      {TIER_VALUES.map((tier) => {
        const tierBooks = books.filter((b) => entries[b.id] === tier);
        return (
          <div
            key={tier}
            className="flex items-stretch gap-3 overflow-hidden rounded-lg border border-border"
          >
            <div
              className={`flex w-12 shrink-0 items-center justify-center text-sm font-semibold ${TIER_COLORS[tier]}`}
            >
              {TIER_LABELS[tier]}
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
    </div>
  );
}
