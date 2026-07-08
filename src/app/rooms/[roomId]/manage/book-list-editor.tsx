"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  searchBooksForRoomAction,
  addExistingBookAction,
  addNewBookAction,
  removeBookAction,
  updateBookMetaAction,
} from "./actions";
import type { RoomBookRecord } from "@/lib/data/roomBooks";
import type { BookRecord } from "@/lib/data/books";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export function BookListEditor({
  roomId,
  isDeployed,
  initialBooks,
}: {
  roomId: string;
  isDeployed: boolean;
  initialBooks: RoomBookRecord[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const visibleResults = query.trim() ? results : [];

  function handleQueryChange(value: string) {
    setQuery(value);
    clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(() => {
      searchBooksForRoomAction(value).then((books) => {
        setResults(books);
        setSearching(false);
      });
    }, 300);
  }

  function handleAddExisting(bookId: string) {
    startTransition(async () => {
      const result = await addExistingBookAction(roomId, bookId, "", "");
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("책을 추가했어요.");
        setQuery("");
        setResults([]);
        router.refresh();
      }
    });
  }

  function handleAddNew(formData: FormData) {
    startTransition(async () => {
      const result = await addNewBookAction(roomId, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("새 책을 추가했어요.");
        router.refresh();
      }
    });
  }

  function handleRemove(roomBookId: string) {
    startTransition(async () => {
      const result = await removeBookAction(roomId, roomBookId);
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleUpdateMeta(roomBookId: string, synopsis: string, rating: string) {
    startTransition(async () => {
      const result = await updateBookMetaAction(roomId, roomBookId, synopsis, rating);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("저장했어요.");
        router.refresh();
      }
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium">책 목록 ({initialBooks.length}권)</h2>
        {isDeployed && (
          <Badge variant="secondary">배포됨 — 책 종류는 더 이상 추가/삭제할 수 없어요</Badge>
        )}
      </div>

      {!isDeployed && (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
          <Label htmlFor="book-search">기존 책 검색해서 추가</Label>
          <Input
            id="book-search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="책 제목 또는 저자로 검색"
          />
          {searching && <p className="text-xs text-muted-foreground">검색 중...</p>}
          {visibleResults.length > 0 && (
            <ul className="flex flex-col gap-1">
              {visibleResults.map((book) => (
                <li
                  key={book.id}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
                >
                  <span className="text-sm">
                    {book.title}
                    {book.author ? ` · ${book.author}` : ""}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => handleAddExisting(book.id)}
                  >
                    추가
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-muted-foreground">
              찾는 책이 없나요? 새로 추가하기
            </summary>
            <form action={handleAddNew} className="mt-3 flex flex-col gap-2">
              <Input name="title" placeholder="책 제목" required maxLength={200} />
              <Input name="author" placeholder="저자 (선택)" maxLength={100} />
              <Input name="coverUrl" placeholder="표지 이미지 URL (선택)" />
              <Textarea name="synopsis" placeholder="이 방에서 보여줄 줄거리 (선택)" rows={2} />
              <Input name="rating" placeholder="평점 0~5 (선택)" />
              <Button type="submit" size="sm" disabled={isPending} className="self-start">
                책 추가
              </Button>
            </form>
          </details>
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {initialBooks.map((rb) => (
          <RoomBookRow
            key={rb.id}
            roomBook={rb}
            isDeployed={isDeployed}
            isPending={isPending}
            onRemove={() => handleRemove(rb.id)}
            onUpdateMeta={(synopsis, rating) => handleUpdateMeta(rb.id, synopsis, rating)}
          />
        ))}
        {initialBooks.length === 0 && (
          <p className="text-sm text-muted-foreground">아직 추가된 책이 없어요.</p>
        )}
      </ul>
    </section>
  );
}

function RoomBookRow({
  roomBook,
  isDeployed,
  isPending,
  onRemove,
  onUpdateMeta,
}: {
  roomBook: RoomBookRecord;
  isDeployed: boolean;
  isPending: boolean;
  onRemove: () => void;
  onUpdateMeta: (synopsis: string, rating: string) => void;
}) {
  const [synopsis, setSynopsis] = useState(roomBook.synopsis ?? "");
  const [rating, setRating] = useState(roomBook.rating?.toString() ?? "");

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-start">
      <div className="flex flex-1 gap-3">
        {roomBook.book.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={roomBook.book.cover_url}
            alt=""
            className="h-20 w-14 shrink-0 rounded object-cover"
          />
        ) : (
          <div className="h-20 w-14 shrink-0 rounded bg-muted" />
        )}
        <div className="flex flex-1 flex-col gap-1.5">
          <p className="text-sm font-medium">{roomBook.book.title}</p>
          {roomBook.book.author && (
            <p className="text-xs text-muted-foreground">{roomBook.book.author}</p>
          )}
          <Textarea
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            placeholder="줄거리 (이 방에서만 표시)"
            rows={2}
            className="text-xs"
          />
          <Input
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            placeholder="평점 0~5"
            className="w-24 text-xs"
          />
        </div>
      </div>
      <div className="flex flex-row gap-2 sm:flex-col">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => onUpdateMeta(synopsis, rating)}
        >
          저장
        </Button>
        {!isDeployed && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-destructive"
            disabled={isPending}
            onClick={onRemove}
          >
            삭제
          </Button>
        )}
      </div>
    </li>
  );
}
