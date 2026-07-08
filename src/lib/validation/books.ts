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

export const createBookSchema = z.object({
  title: z.string().trim().min(1, "책 제목을 입력해주세요.").max(200),
  author: optionalText(100),
  coverUrl: optionalUrl(),
});

export const updateBookSchema = createBookSchema.extend({
  bookId: z.string().uuid(),
});
