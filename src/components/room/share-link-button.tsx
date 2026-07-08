"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareLinkButton({ url, title }: { url: string; title: string }) {
  async function handleShare() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled the native share sheet — fall through to clipboard copy
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success("링크를 복사했어요.");
  }

  return (
    <Button type="button" variant="outline" onClick={handleShare}>
      링크 공유
    </Button>
  );
}
