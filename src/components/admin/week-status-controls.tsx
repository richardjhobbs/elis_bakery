"use client";

import { Button } from "@/components/ui/button";
import { updateWeekStatus, deleteWeek } from "@/lib/actions/week-actions";
import { useState } from "react";
import type { WeekStatus } from "@/lib/constants";
import { toast } from "sonner";

interface WeekStatusControlsProps {
  weekId: string;
  status: WeekStatus;
}

export function WeekStatusControls({
  weekId,
  status,
}: WeekStatusControlsProps) {
  const [loading, setLoading] = useState(false);

  async function handleStatusChange(newStatus: string) {
    setLoading(true);
    const result = await updateWeekStatus(weekId, newStatus);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`Week status updated to ${newStatus}`);
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this week? This cannot be undone.")) return;
    setLoading(true);
    const result = await deleteWeek(weekId);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "draft" && (
        <Button
          onClick={() => handleStatusChange("open")}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white"
          size="sm"
        >
          Publish (Open)
        </Button>
      )}
      {status === "open" && (
        <Button
          onClick={() => handleStatusChange("closed")}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          Close Orders
        </Button>
      )}
      {status === "closed" && (
        <>
          <Button
            onClick={() => handleStatusChange("open")}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            Re-open
          </Button>
        </>
      )}
      {status === "draft" && (
        <Button
          onClick={handleDelete}
          disabled={loading}
          variant="destructive"
          size="sm"
        >
          Delete
        </Button>
      )}
    </div>
  );
}
