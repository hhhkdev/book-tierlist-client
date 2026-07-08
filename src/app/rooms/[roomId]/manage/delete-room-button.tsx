"use client";

import { useState, useTransition } from "react";
import { deleteRoomAction } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteRoomButton({ roomId }: { roomId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(() => {
      deleteRoomAction(roomId);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        방 삭제하기
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>이 방을 완전히 삭제할까요?</DialogTitle>
          <DialogDescription>
            방의 책 목록, 참여자, 제출된 모든 티어리스트와 댓글이 영구적으로 삭제돼요. 이 작업은
            되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "삭제 중..." : "삭제합니다"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
