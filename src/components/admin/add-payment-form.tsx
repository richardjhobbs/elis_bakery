"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { addPayment } from "@/lib/actions/customer-actions";
import { useState } from "react";
import { toast } from "sonner";

export function AddPaymentForm({ customerId }: { customerId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await addPayment(customerId, formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Payment recorded");
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-medium text-brown-800">Record Payment</h2>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="flex items-end gap-3">
          <div className="flex-1 space-y-1">
            <Label htmlFor="amount">Amount (SGD)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="description">Note (optional)</Label>
            <Input
              id="description"
              name="description"
              placeholder="e.g. PayNow received"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white shrink-0"
          >
            {loading ? "Saving..." : "Add Payment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
