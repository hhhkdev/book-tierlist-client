"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  adminSearchBooksAction,
  adminUpdateBookAction,
  adminDeleteBookAction,
} from "./actions";
import type { BookRecord } from "@/lib/data/books";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BooksTab({ initialBooks }: { initialBooks: BookRecord[] }) {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState(initialBooks);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function handleQueryChange(value: string) {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const results = await adminSearchBooksAction(value);
        setBooks(results);
      });
    }, 300);
  }

  function handleSave(bookId: string, formData: FormData) {
    startTransition(async () => {
      const result = await adminUpdateBookAction(bookId, formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.book) {
        setBooks((prev) => prev.map((b) => (b.id === bookId ? result.book! : b)));
        toast.success("저장했어요.");
      }
    });
  }

  function handleDelete(bookId: string) {
    startTransition(async () => {
      const result = await adminDeleteBookAction(bookId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setBooks((prev) => prev.filter((b) => b.id !== bookId));
        toast.success("삭제했어요.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="admin-book-search">책 검색</Label>
        <Input
          id="admin-book-search"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="제목 또는 저자로 검색"
        />
      </div>

      {books.length === 0 ? (
        <p className="text-sm text-muted-foreground">책이 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {books.map((book) => (
            <BookRow
              key={book.id}
              book={book}
              isPending={isPending}
              onSave={(formData) => handleSave(book.id, formData)}
              onDelete={() => handleDelete(book.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function BookRow({
  book,
  isPending,
  onSave,
  onDelete,
}: {
  book: BookRecord;
  isPending: boolean;
  onSave: (formData: FormData) => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center">
      <form
        action={onSave}
        className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3"
      >
        <Input name="title" defaultValue={book.title} placeholder="제목" required maxLength={200} />
        <Input name="author" defaultValue={book.author ?? ""} placeholder="저자" maxLength={100} />
        <Input name="coverUrl" defaultValue={book.cover_url ?? ""} placeholder="표지 URL" />
        <div className="flex gap-2 sm:col-span-3">
          <Button type="submit" size="sm" variant="outline" disabled={isPending}>
            저장
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-destructive"
            disabled={isPending}
            onClick={onDelete}
          >
            삭제
          </Button>
        </div>
      </form>
    </li>
  );
}
