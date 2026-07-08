"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateRoomSettingsAction } from "./actions";
import type { RoomRecord } from "@/lib/data/rooms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export function RoomSettingsForm({ room }: { room: RoomRecord }) {
  const [isPending, startTransition] = useTransition();
  const [removePassword, setRemovePassword] = useState(false);
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(formData: FormData) {
    setError(undefined);
    if (removePassword) {
      formData.set("removePassword", "true");
    }
    startTransition(async () => {
      const result = await updateRoomSettingsAction(room.id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        toast.success("방 설정을 저장했어요.");
      }
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-base font-medium">방 설정</h2>
      <form action={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">방 제목</Label>
          <Input id="title" name="title" defaultValue={room.title} required maxLength={100} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="coverUrl">커버 이미지 URL</Label>
          <Input id="coverUrl" name="coverUrl" defaultValue={room.cover_url ?? ""} placeholder="https://..." />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">방 설명</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={room.description ?? ""}
            rows={3}
            maxLength={1000}
          />
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
          <div className="flex items-center gap-2">
            <Label>비밀번호</Label>
            <Badge variant={room.password_hash ? "default" : "secondary"}>
              {room.password_hash ? "비공개 (링크로만 접근)" : "공개"}
            </Badge>
          </div>
          <Label htmlFor="newPassword" className="text-xs text-muted-foreground">
            새 비밀번호로 변경하려면 입력하세요. 비워두면 기존 설정이 유지돼요.
          </Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            maxLength={100}
            disabled={removePassword}
          />
          {room.password_hash && (
            <label className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={removePassword}
                onChange={(e) => setRemovePassword(e.target.checked)}
                className="size-4"
              />
              비밀번호를 제거하고 공개방으로 전환
            </label>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={isPending} className="self-start">
          {isPending ? "저장 중..." : "설정 저장"}
        </Button>
      </form>
    </section>
  );
}
