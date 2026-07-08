"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { adminDeleteRoomAction } from "./actions";
import type { AdminRoomRecord } from "@/lib/data/admin";
import { Badge } from "@/components/ui/badge";
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

export function RoomsTab({ initialRooms }: { initialRooms: AdminRoomRecord[] }) {
  const [rooms, setRooms] = useState(initialRooms);
  const [isPending, startTransition] = useTransition();

  function handleDelete(roomId: string) {
    startTransition(async () => {
      const result = await adminDeleteRoomAction(roomId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setRooms((prev) => prev.filter((r) => r.id !== roomId));
        toast.success("방을 삭제했어요.");
      }
    });
  }

  if (rooms.length === 0) {
    return <p className="text-sm text-muted-foreground">아직 생성된 방이 없어요.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {rooms.map((room) => (
        <li
          key={room.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{room.title}</p>
            <p className="text-xs text-muted-foreground">
              방장: {room.owner?.name ?? "알 수 없음"} ·{" "}
              {new Date(room.created_at).toLocaleDateString("ko-KR")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={room.is_deployed ? "default" : "secondary"}>
              {room.is_deployed ? "배포됨" : "준비중"}
            </Badge>
            {room.password_hash && <Badge variant="outline">비공개</Badge>}
            <Dialog>
              <DialogTrigger render={<Button variant="destructive" size="sm" disabled={isPending} />}>
                삭제
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>&ldquo;{room.title}&rdquo; 방을 삭제할까요?</DialogTitle>
                  <DialogDescription>
                    방의 책 목록, 참여자, 제출된 티어리스트가 모두 영구 삭제됩니다.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="destructive" onClick={() => handleDelete(room.id)}>
                    삭제합니다
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </li>
      ))}
    </ul>
  );
}
