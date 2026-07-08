"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { setTierPlacementAction } from "@/app/rooms/[roomId]/board/actions";
import type { RoomBookRecord } from "@/lib/data/roomBooks";
import { RANKED_TIER_VALUES, type TierValue } from "@/lib/constants";
import { TierRow } from "./tier-row";
import { BookPool, POOL_ID } from "./book-pool";
import { DismissibleHintBanner } from "@/components/onboarding/dismissible-hint-banner";

export function TierBoard({
  roomId,
  books,
  initialEntries,
}: {
  roomId: string;
  books: RoomBookRecord[];
  initialEntries: Record<string, TierValue>;
}) {
  const [placements, setPlacements] = useState<Record<string, TierValue | null>>(() => {
    const map: Record<string, TierValue | null> = {};
    for (const book of books) {
      map[book.id] = initialEntries[book.id] ?? null;
    }
    return map;
  });
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  function applyPlacement(bookId: string, tier: TierValue | null) {
    const previous = placements[bookId] ?? null;
    if (previous === tier) return;

    setPlacements((prev) => ({ ...prev, [bookId]: tier }));
    startTransition(async () => {
      const result = await setTierPlacementAction(roomId, bookId, tier);
      if (result.error) {
        toast.error(result.error);
        setPlacements((prev) => ({ ...prev, [bookId]: previous }));
      }
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const bookId = String(event.active.id);
    const overId = event.over?.id;
    if (!overId) return;

    const tier = overId === POOL_ID ? null : (String(overId) as TierValue);
    applyPlacement(bookId, tier);
  }

  function handleSelectToggle(bookId: string) {
    setSelectedBookId((prev) => (prev === bookId ? null : bookId));
  }

  function handleTapAssign(tier: TierValue | null) {
    if (!selectedBookId) return;
    applyPlacement(selectedBookId, tier);
    setSelectedBookId(null);
  }

  const poolBooks = books.filter((b) => placements[b.id] === null);

  return (
    <div className="flex flex-col gap-4">
      <DismissibleHintBanner storageKey="tier-board-hint">
        책 표지를 원하는 티어 행으로 드래그하거나, 책을 탭한 뒤 원하는 행을 탭해서 옮길 수 있어요.
        읽지 않았거나 순위를 매기기 어려운 책은 &ldquo;기타&rdquo; 행에 놓아주세요.
      </DismissibleHintBanner>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-2">
          {RANKED_TIER_VALUES.map((tier) => (
            <TierRow
              key={tier}
              tier={tier}
              books={books.filter((b) => placements[b.id] === tier)}
              selectedBookId={selectedBookId}
              onSelectToggle={handleSelectToggle}
              onTapAssign={handleTapAssign}
            />
          ))}
          <TierRow
            tier="ETC"
            books={books.filter((b) => placements[b.id] === "ETC")}
            selectedBookId={selectedBookId}
            onSelectToggle={handleSelectToggle}
            onTapAssign={handleTapAssign}
          />
        </div>

        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-muted-foreground">아직 배치하지 않은 책</p>
          <BookPool
            books={poolBooks}
            selectedBookId={selectedBookId}
            onSelectToggle={handleSelectToggle}
            onTapAssign={() => handleTapAssign(null)}
          />
        </div>
      </DndContext>
    </div>
  );
}
