"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/lib/actions/week-actions";
import { useState } from "react";
import { toast } from "sonner";

export function DeleteProductButton({
  productId,
  weekId,
}: {
  productId: string;
  weekId: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this product?")) return;
    setLoading(true);
    const result = await deleteProduct(productId, weekId);
    if (result?.error) {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="text-destructive hover:text-destructive"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
