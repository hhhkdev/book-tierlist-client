"use client";

import { useState } from "react";
import type { RoomBookRecord } from "@/lib/data/roomBooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function BookGalleryGrid({ books }: { books: RoomBookRecord[] }) {
  const [selected, setSelected] = useState<RoomBookRecord | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {books.map((rb) => (
          <button
            key={rb.id}
            type="button"
            onClick={() => setSelected(rb)}
            className="flex flex-col gap-2 rounded-lg border border-border p-2 text-left transition-colors hover:bg-accent"
          >
            {rb.book.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={rb.book.cover_url}
                alt=""
                className="aspect-3/4 w-full rounded object-cover"
              />
            ) : (
              <div className="aspect-3/4 w-full rounded bg-muted" />
            )}
            <div>
              <p className="line-clamp-2 text-sm font-medium">{rb.book.title}</p>
              {rb.book.author && (
                <p className="text-xs text-muted-foreground">{rb.book.author}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.book.title}</DialogTitle>
                <DialogDescription>{selected.book.author ?? "저자 미상"}</DialogDescription>
              </DialogHeader>
              {selected.book.cover_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.book.cover_url}
                  alt=""
                  className="mx-auto max-h-64 rounded object-cover"
                />
              )}
              {selected.rating != null && (
                <p className="text-sm">평점: {selected.rating.toFixed(1)} / 5</p>
              )}
              {selected.synopsis && (
                <p className="text-sm text-muted-foreground">{selected.synopsis}</p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
