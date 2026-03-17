"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateOrderNotes } from "@/lib/actions/order-actions";
import { useState } from "react";
import { toast } from "sonner";
import { MessageSquare, Check } from "lucide-react";

interface OrderNotesProps {
  orderId: string;
  weekId: string;
  notes: string | null;
}

export function OrderNotes({ orderId, weekId, notes }: OrderNotesProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(notes || "");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    const result = await updateOrderNotes(orderId, value, weekId);
    if (result?.error) {
      toast.error(result.error);
    }
    setLoading(false);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        title={notes || "Add notes"}
      >
        <MessageSquare
          className={`h-3.5 w-3.5 ${notes ? "text-terracotta-500" : ""}`}
        />
        {notes && (
          <span className="max-w-[100px] truncate">{notes}</span>
        )}
      </button>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add notes..."
        rows={2}
        className="text-xs min-w-[150px]"
      />
      <Button
        size="sm"
        onClick={handleSave}
        disabled={loading}
        className="shrink-0"
      >
        <Check className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
