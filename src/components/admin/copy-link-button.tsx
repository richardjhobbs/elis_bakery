"use client";

import { Button } from "@/components/ui/button";
import { ClipboardCopy, Check } from "lucide-react";
import { useState } from "react";

export function CopyLinkButton({ weekId }: { weekId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/order/${weekId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy}>
      {copied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <ClipboardCopy className="h-4 w-4" />
      )}
    </Button>
  );
}
