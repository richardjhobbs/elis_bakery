"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createWeek } from "@/lib/actions/week-actions";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewWeekPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [collectionDays, setCollectionDays] = useState<string[]>(["friday"]);

  function toggleDay(day: string) {
    setCollectionDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    // Add collection days to formData
    collectionDays.forEach((day) => formData.append("collection_days", day));
    const result = await createWeek(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <Link
        href="/admin/weeks"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Weeks
      </Link>

      <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold text-brown-800">
            Create New Week
          </h1>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Week Label</Label>
              <Input
                id="label"
                name="label"
                placeholder="e.g. Week of 24 Mar 2026"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="opens_at">Opens</Label>
                <Input
                  id="opens_at"
                  name="opens_at"
                  type="datetime-local"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closes_at">Closes</Label>
                <Input
                  id="closes_at"
                  name="closes_at"
                  type="datetime-local"
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

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              className="w-full bg-brown-700 hover:bg-brown-800 text-cream-50"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Week"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
