import { cn } from "@/lib/utils";
import { WEEK_STATUS_COLORS, PAYMENT_STATUS_COLORS } from "@/lib/constants";
import type { WeekStatus, PaymentStatus } from "@/lib/constants";

export function WeekStatusBadge({ status }: { status: WeekStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        WEEK_STATUS_COLORS[status]
      )}
    >
      {status}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const label = status === "on_account" ? "On Account" : status;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        PAYMENT_STATUS_COLORS[status]
      )}
    >
      {label}
    </span>
  );
}
