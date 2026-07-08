"use client";

import { startTransition, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DismissibleHintBanner({
  storageKey,
  children,
}: {
  storageKey: string;
  children: React.ReactNode;
}) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const isDismissed = window.localStorage.getItem(storageKey) === "1";
    startTransition(() => {
      setDismissed(isDismissed);
    });
  }, [storageKey]);

  if (dismissed) return null;

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
      <p className="flex-1">{children}</p>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => {
          window.localStorage.setItem(storageKey, "1");
          setDismissed(true);
        }}
        aria-label="닫기"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
