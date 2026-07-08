"use client";

import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { RoomBookRecord } from "@/lib/data/roomBooks";

export function BookChip({
  roomBook,
  isSelected,
  onSelectToggle,
}: {
  roomBook: RoomBookRecord;
  isSelected: boolean;
  onSelectToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: roomBook.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onSelectToggle}
      style={style}
      className={cn(
        "w-14 shrink-0 touch-none rounded-md ring-2 ring-transparent transition-shadow",
        isSelected && "ring-primary",
        isDragging && "z-10 opacity-70"
      )}
      title={roomBook.book.title}
      {...listeners}
      {...attributes}
    >
      {roomBook.book.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={roomBook.book.cover_url}
          alt={roomBook.book.title}
          className="aspect-3/4 w-full rounded object-cover"
          draggable={false}
        />
      ) : (
        <div className="flex aspect-3/4 w-full items-center justify-center rounded bg-muted p-1 text-center text-[10px] leading-tight">
          {roomBook.book.title}
        </div>
      )}
    </button>
  );
}
