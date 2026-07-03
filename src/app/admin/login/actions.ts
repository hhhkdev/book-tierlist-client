"use server";

import { redirect } from "next/navigation";
import { adminLoginSchema } from "@/lib/validation/auth";
import { verifyAdminCredentials, createAdminSession } from "@/lib/auth/admin-session";
import type { AuthFormState } from "@/app/(auth)/actions";

export async function loginAdminAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = adminLoginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "입력값을 확인해주세요." };
  }

  const isValid = verifyAdminCredentials(parsed.data.username, parsed.data.password);
  if (!isValid) {
    return { error: "아이디 또는 비밀번호가 올바르지 않습니다." };
  }

  await createAdminSession();
  redirect("/admin/dashboard");
}
