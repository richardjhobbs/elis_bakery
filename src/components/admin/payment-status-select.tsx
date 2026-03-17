"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { PaymentStatusBadge } from "@/components/shared/status-badge";
import { updateOrderPaymentStatus } from "@/lib/actions/order-actions";
import { useState } from "react";
import { toast } from "sonner";
import type { PaymentStatus } from "@/lib/constants";
import { PAYMENT_STATUSES } from "@/lib/constants";

interface PaymentStatusSelectProps {
  orderId: string;
  weekId: string;
  currentStatus: PaymentStatus;
}

export function PaymentStatusSelect({
  orderId,
  weekId,
  currentStatus,
}: PaymentStatusSelectProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleChange(status: PaymentStatus) {
    if (status === currentStatus) {
      setOpen(false);
      return;
    }
    setLoading(true);
    const result = await updateOrderPaymentStatus(orderId, status, weekId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Payment status updated");
    }
    setLoading(false);
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button type="button" className="cursor-pointer" />
        }
      >
        <PaymentStatusBadge status={currentStatus} />
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Update Payment Status</SheetTitle>
          <SheetDescription>Select the new payment status for this order.</SheetDescription>
        </SheetHeader>
        <div className="space-y-2 p-4">
          {PAYMENT_STATUSES.map((status) => (
            <Button
              key={status}
              variant={status === currentStatus ? "default" : "outline"}
              className="w-full justify-start capitalize"
              onClick={() => handleChange(status)}
              disabled={loading}
            >
              {status === "on_account" ? "On Account" : status}
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
