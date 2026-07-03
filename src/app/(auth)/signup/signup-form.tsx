"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type AuthFormState } from "../actions";
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

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signupAction, initialState);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>방장 회원가입</CardTitle>
        <CardDescription>
          이름과 비밀번호만으로 가입해요. 이름은 다른 사람과 겹칠 수 없어요.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">이름</Label>
            <Input id="name" name="name" required maxLength={50} autoComplete="username" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={4}
              autoComplete="new-password"
            />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "가입 중..." : "가입하기"}
          </Button>
          <p className="text-sm text-muted-foreground">
            이미 계정이 있나요?{" "}
            <Link href="/login" className="text-primary underline underline-offset-4">
              로그인
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
