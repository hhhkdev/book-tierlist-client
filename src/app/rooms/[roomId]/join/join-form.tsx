"use client";

import { useActionState } from "react";
import { joinRoomAction, type GuestJoinState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfoTooltip } from "@/components/onboarding/info-tooltip";

const initialState: GuestJoinState = {};

export function JoinForm({ roomId, roomTitle }: { roomId: string; roomTitle: string }) {
  const action = joinRoomAction.bind(null, roomId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{roomTitle}</CardTitle>
        <CardDescription>이름과 직책만 입력하면 바로 티어를 매길 수 있어요.</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">이름</Label>
            <Input id="name" name="name" required maxLength={50} />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="position">직책</Label>
              <InfoTooltip>
                같은 이름+직책으로 다시 들어오면 이전에 매긴 티어리스트를 이어서 수정할 수 있어요.
              </InfoTooltip>
            </div>
            <Input id="position" name="position" placeholder="예: 8기" required maxLength={50} />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "입장 중..." : "티어 매기러 가기"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
