"use server";

import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { createRoomSchema } from "@/lib/validation/rooms";
import { createRoom } from "@/lib/data/rooms";

export interface CreateRoomFormState {
  error?: string;
}

export async function createRoomAction(
  _prevState: CreateRoomFormState,
  formData: FormData
): Promise<CreateRoomFormState> {
  const session = await getUserSession();
  if (!session) {
    redirect("/login");
  }

  const parsed = createRoomSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    coverUrl: formData.get("coverUrl"),
    ownerPosition: formData.get("ownerPosition"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const room = await createRoom(session.sub, parsed.data);
  redirect(`/rooms/${room.id}/manage`);
}
