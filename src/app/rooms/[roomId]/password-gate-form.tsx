"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifyRoomPasswordAction, type PasswordGateState } from "./password-gate-actions";
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

export function PasswordGateForm({ roomId, roomTitle }: { roomId: string; roomTitle: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(formData: FormData) {
    setError(undefined);
    startTransition(async () => {
      const result: PasswordGateState = await verifyRoomPasswordAction(roomId, {}, formData);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{roomTitle}</CardTitle>
          <CardDescription>비밀번호가 필요한 방이에요. 비밀번호를 입력해주세요.</CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="flex flex-col gap-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" name="password" type="password" required autoFocus />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "확인 중..." : "입장하기"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
