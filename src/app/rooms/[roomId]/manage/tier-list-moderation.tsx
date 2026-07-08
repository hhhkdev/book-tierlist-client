"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteTierListAction } from "./actions";
import type { TierListSummary } from "@/lib/data/tierLists";
import { Button } from "@/components/ui/button";

export function TierListModeration({
  roomId,
  initialSummaries,
}: {
  roomId: string;
  initialSummaries: TierListSummary[];
}) {
  const [summaries, setSummaries] = useState(initialSummaries);
  const [isPending, startTransition] = useTransition();

  function handleDelete(tierListId: string) {
    startTransition(async () => {
      const result = await deleteTierListAction(roomId, tierListId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setSummaries((prev) => prev.filter((s) => s.id !== tierListId));
        toast.success("삭제했어요.");
      }
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-medium">제출된 티어리스트 ({summaries.length}개)</h2>
      <p className="text-sm text-muted-foreground">
        예기치 않은 사람이 작성한 티어리스트가 있다면 삭제할 수 있어요.
      </p>
      {summaries.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 제출된 티어리스트가 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {summaries.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-border p-3"
            >
              <div className="text-sm">
                <span className="font-medium">{s.guest.name}</span>
                <span className="text-muted-foreground"> · {s.guest.position}</span>
                <p className="text-xs text-muted-foreground">
                  {new Date(s.updated_at).toLocaleString("ko-KR")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/rooms/${roomId}/tierlists/${s.id}`}
                  className="text-sm text-primary underline underline-offset-4"
                >
                  보기
                </a>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  disabled={isPending}
                  onClick={() => handleDelete(s.id)}
                >
                  삭제
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
