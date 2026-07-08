"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { RoomBookRecord } from "@/lib/data/roomBooks";
import { BookChip } from "./book-chip";

export const POOL_ID = "POOL";

export function BookPool({
  books,
  selectedBookId,
  onSelectToggle,
  onTapAssign,
}: {
  books: RoomBookRecord[];
  selectedBookId: string | null;
  onSelectToggle: (bookId: string) => void;
  onTapAssign: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: POOL_ID });

  return (
    <div
      ref={setNodeRef}
      data-testid="book-pool"
      onClick={() => selectedBookId && onTapAssign()}
      className={cn(
        "flex min-h-24 flex-wrap items-start gap-2 rounded-lg border border-dashed border-border p-3 transition-colors",
        isOver && "bg-accent",
        selectedBookId && "cursor-pointer"
      )}
    >
      {books.length === 0 ? (
        <p className="text-xs text-muted-foreground">모든 책을 티어에 배치했어요!</p>
      ) : (
        books.map((rb) => (
          <BookChip
            key={rb.id}
            roomBook={rb}
            isSelected={selectedBookId === rb.id}
            onSelectToggle={() => onSelectToggle(rb.id)}
          />
        ))
      )}
    </div>
  );
}
