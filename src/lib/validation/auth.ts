import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해주세요.").max(50),
  password: z.string().min(4, "비밀번호는 4자 이상이어야 합니다.").max(100),
});

export const loginSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export const adminLoginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export const guestLoginSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해주세요.").max(50),
  position: z.string().trim().min(1, "직책을 입력해주세요.").max(50),
});
