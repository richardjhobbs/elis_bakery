"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { copyProductsFromLastWeek } from "@/lib/actions/week-actions";
import { useState } from "react";
import { toast } from "sonner";

export function CopyProductsButton({ weekId }: { weekId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleCopy() {
    setLoading(true);
    const result = await copyProductsFromLastWeek(weekId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`Copied ${result.count} products from last week`);
    }
    setLoading(false);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      disabled={loading}
    >
      <Copy className="h-3.5 w-3.5 mr-1.5" />
      {loading ? "Copying..." : "Copy from Last Week"}
    </Button>
  );
}
