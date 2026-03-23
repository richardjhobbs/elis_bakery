"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteOrder } from "@/lib/actions/order-actions";
import { useState } from "react";
import { toast } from "sonner";

export function DeleteOrderButton({
  orderId,
  weekId,
  customerName,
}: {
  orderId: string;
  weekId: string;
  customerName: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete order from ${customerName}? This cannot be undone.`))
      return;
    setLoading(true);
    const result = await deleteOrder(orderId, weekId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Order deleted");
    }
    setLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="h-7 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
    >
      <Trash2 className="h-3 w-3" />
      Delete
    </Button>
  );
}
