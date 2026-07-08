"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deployRoomAction } from "./actions";
import type { RoomRecord } from "@/lib/data/rooms";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeploySection({
  roomId,
  room,
  bookCount,
}: {
  roomId: string;
  room: RoomRecord;
  bookCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (room.is_deployed) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium">배포 상태</h2>
        <div className="flex items-center gap-2">
          <Badge>배포됨</Badge>
          <p className="text-sm text-muted-foreground">
            {new Date(room.deployed_at ?? room.created_at).toLocaleString("ko-KR")} 부터 게스트가
            참여할 수 있어요.
          </p>
        </div>
        <a
          href={`/rooms/${roomId}`}
          className="text-sm text-primary underline underline-offset-4"
        >
          방 페이지에서 참여 링크 확인하기
        </a>
      </section>
    );
  }

  function handleDeploy() {
    startTransition(async () => {
      const result = await deployRoomAction(roomId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("배포했어요! 이제 게스트가 참여할 수 있어요.");
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-medium">배포</h2>
      <p className="text-sm text-muted-foreground">
        배포하기 전까지는 게스트가 이 방에 들어올 수 없어요. 배포하면 책 종류(멤버십)는 더 이상
        추가·삭제할 수 없지만, 줄거리·평점은 이후에도 계속 수정할 수 있어요.
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button disabled={bookCount === 0} className="self-start" />}>
          배포하기
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정말 배포할까요?</DialogTitle>
            <DialogDescription>
              배포하면 지금 담긴 {bookCount}권의 책 목록(어떤 책이 포함되는지)은 더 이상 바꿀 수
              없어요. 줄거리와 평점은 배포 후에도 자유롭게 수정할 수 있습니다. 배포 후에는 방
              링크로 누구나 참여할 수 있게 돼요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button onClick={handleDeploy} disabled={isPending}>
              {isPending ? "배포 중..." : "네, 배포합니다"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {bookCount === 0 && (
        <p className="text-xs text-destructive">책을 한 권 이상 추가해야 배포할 수 있어요.</p>
      )}
    </section>
  );
}
