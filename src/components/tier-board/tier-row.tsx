"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { RoomBookRecord } from "@/lib/data/roomBooks";
import { BookChip } from "./book-chip";
import type { TierValue } from "@/lib/constants";
import { TIER_LABELS, TIER_COLORS } from "./tier-visuals";

export function TierRow({
  tier,
  books,
  selectedBookId,
  onSelectToggle,
  onTapAssign,
}: {
  tier: TierValue;
  books: RoomBookRecord[];
  selectedBookId: string | null;
  onSelectToggle: (bookId: string) => void;
  onTapAssign: (tier: TierValue) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: tier });

  return (
    <div
      ref={setNodeRef}
      onClick={() => selectedBookId && onTapAssign(tier)}
      className={cn(
        "flex min-h-20 items-stretch gap-2 rounded-lg border border-border transition-colors",
        isOver && "bg-accent",
        selectedBookId && "cursor-pointer"
      )}
    >
      <div
        className={cn(
          "flex w-12 shrink-0 items-center justify-center rounded-l-lg text-sm font-semibold",
          TIER_COLORS[tier]
        )}
      >
        {TIER_LABELS[tier]}
      </div>
      <div className="flex flex-1 flex-wrap items-center gap-2 p-2">
        {books.map((rb) => (
          <BookChip
            key={rb.id}
            roomBook={rb}
            isSelected={selectedBookId === rb.id}
            onSelectToggle={() => onSelectToggle(rb.id)}
          />
        ))}
      </div>
    </div>
  );
}
