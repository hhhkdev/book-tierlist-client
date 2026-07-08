import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null));

const optionalUrl = () =>
  z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^https?:\/\//i.test(v), {
      message: "http(s):// 로 시작하는 URL을 입력해주세요.",
    });

const optionalPassword = () =>
  z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null));

export const createRoomSchema = z.object({
  title: z.string().trim().min(1, "방 제목을 입력해주세요.").max(100),
  description: optionalText(1000),
  coverUrl: optionalUrl(),
  ownerPosition: z.string().trim().min(1, "직책을 입력해주세요.").max(50),
  password: optionalPassword(),
});

export const updateRoomSettingsSchema = z.object({
  title: z.string().trim().min(1, "방 제목을 입력해주세요.").max(100),
  description: optionalText(1000),
  coverUrl: optionalUrl(),
  // undefined = leave password unchanged, null = remove it, string = set a new one.
  newPassword: optionalPassword(),
  removePassword: z.union([z.literal("true"), z.literal("on")]).optional(),
});
