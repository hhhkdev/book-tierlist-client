"use client";

import { useActionState } from "react";
import { loginAdminAction } from "./actions";
import type { AuthFormState } from "@/app/(auth)/actions";
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

const initialState: AuthFormState = {};

export function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(loginAdminAction, initialState);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>관리자 로그인</CardTitle>
        <CardDescription>사이트 전체를 관리하는 관리자 전용 페이지입니다.</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="username">아이디</Label>
            <Input id="username" name="username" required autoComplete="username" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "확인 중..." : "로그인"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
