"use client";

import { useActionState } from "react";
import { createRoomAction, type CreateRoomFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfoTooltip } from "@/components/onboarding/info-tooltip";

const initialState: CreateRoomFormState = {};

export function RoomForm() {
  const [state, formAction, isPending] = useActionState(createRoomAction, initialState);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>새 방 만들기</CardTitle>
        <CardDescription>
          방에 포함할 책은 다음 단계에서 고를 수 있어요. 최대 참여 인원은 50명으로 고정돼요.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">방 제목</Label>
            <Input id="title" name="title" required maxLength={100} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="coverUrl">커버 이미지 URL (선택)</Label>
            <Input id="coverUrl" name="coverUrl" placeholder="https://..." />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">방 설명 (선택)</Label>
            <Textarea id="description" name="description" rows={3} maxLength={1000} />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="ownerPosition">방장 직책</Label>
              <InfoTooltip>
                이 방에서만 표시되는 직책이에요. 계정과 무관하게 방마다 다르게 입력할 수 있어요.
              </InfoTooltip>
            </div>
            <Input id="ownerPosition" name="ownerPosition" placeholder="예: 8기" required maxLength={50} />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="password">방 비밀번호 (선택)</Label>
              <InfoTooltip>
                비밀번호를 설정하면 이 방은 메인 목록에 노출되지 않아요. 링크와 비밀번호를 아는 사람만
                들어올 수 있어요.
              </InfoTooltip>
            </div>
            <Input id="password" name="password" type="password" maxLength={100} />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "만드는 중..." : "방 만들고 책 고르러 가기"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
