"use server";

import { redirect } from "next/navigation";
import { signupSchema, loginSchema } from "@/lib/validation/auth";
import { createUser, verifyUserCredentials } from "@/lib/data/users";
import { createUserSession, clearUserSession } from "@/lib/auth/session";
import { DomainError } from "@/lib/data/errors";

export interface AuthFormState {
  error?: string;
}

export async function signupAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  try {
    const user = await createUser(parsed.data.name, parsed.data.password);
    await createUserSession({ sub: user.id, name: user.name });
  } catch (err) {
    if (err instanceof DomainError) {
      return { error: err.message };
    }
    throw err;
  }

  redirect("/");
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    name: formData.get("name"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const user = await verifyUserCredentials(parsed.data.name, parsed.data.password);
  if (!user) {
    return { error: "이름 또는 비밀번호가 올바르지 않습니다." };
  }

  await createUserSession({ sub: user.id, name: user.name });
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await clearUserSession();
  redirect("/");
}
