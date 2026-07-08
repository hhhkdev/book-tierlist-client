"use client";

import { useActionState } from "react";
import { addCommentAction, type CommentActionResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialState: CommentActionResult = {};

export function CommentForm({
  roomId,
  tierListId,
  eligibilityMessage,
}: {
  roomId: string;
  tierListId: string;
  eligibilityMessage: string | null;
}) {
  const action = addCommentAction.bind(null, roomId, tierListId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  if (eligibilityMessage) {
    return <p className="text-sm text-muted-foreground">{eligibilityMessage}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Textarea name="content" placeholder="의견을 남겨보세요" rows={2} maxLength={500} required />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" className="self-start" disabled={isPending}>
        {isPending ? "등록 중..." : "댓글 남기기"}
      </Button>
    </form>
  );
}
