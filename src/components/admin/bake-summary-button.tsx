"use client";

import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export function BakeSummaryButton({ weekId }: { weekId: string }) {
  const handleDownload = () => {
    window.open(`/api/bake-summary?weekId=${weekId}`, "_blank");
  };

  return (
    <Button
      onClick={handleDownload}
      variant="outline"
      size="sm"
      className="gap-1.5"
    >
      <FileText className="h-4 w-4" />
      Bake Summary
    </Button>
  );
}
