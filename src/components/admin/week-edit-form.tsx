"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { updateWeek } from "@/lib/actions/week-actions";
import { useState } from "react";
import { toast } from "sonner";
import type { Week } from "@/lib/types/database";

function toLocalDatetime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function WeekEditForm({ week }: { week: Week }) {
  const [loading, setLoading] = useState(false);
  const [collectionDays, setCollectionDays] = useState<string[]>(
    week.collection_days || []
  );

  function toggleDay(day: string) {
    setCollectionDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    collectionDays.forEach((day) => formData.append("collection_days", day));
    const result = await updateWeek(week.id, formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Week updated");
    }
    setLoading(false);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="label">Label</Label>
        <Input id="label" name="label" defaultValue={week.label} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="opens_at">Opens</Label>
          <Input
            id="opens_at"
            name="opens_at"
            type="datetime-local"
            defaultValue={toLocalDatetime(week.opens_at)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="closes_at">Closes</Label>
          <Input
            id="closes_at"
            name="closes_at"
            type="datetime-local"
            defaultValue={toLocalDatetime(week.closes_at)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Collection Days</Label>
        <div className="flex gap-4">
          {["friday", "saturday"].map((day) => (
            <label
              key={day}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={collectionDays.includes(day)}
                onCheckedChange={() => toggleDay(day)}
              />
              <span className="text-sm capitalize">{day}</span>
            </label>
          ))}
        </div>
      </div>
      <Button
        type="submit"
        size="sm"
        className="bg-brown-700 hover:bg-brown-800 text-cream-50"
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
