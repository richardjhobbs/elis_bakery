export const WEEK_STATUSES = ["draft", "open", "closed", "dispatched"] as const;
export type WeekStatus = (typeof WEEK_STATUSES)[number];

export const PAYMENT_STATUSES = ["pending", "paid", "on_account"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const COLLECTION_DAYS = ["friday", "saturday"] as const;
export type CollectionDay = (typeof COLLECTION_DAYS)[number];

export const TRANSACTION_TYPES = ["credit", "debit"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const WEEK_STATUS_COLORS: Record<WeekStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  open: "bg-green-100 text-green-700",
  closed: "bg-amber-100 text-amber-700",
  dispatched: "bg-blue-100 text-blue-700",
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  on_account: "bg-blue-100 text-blue-700",
};
