export type Week = {
  id: string;
  label: string;
  opens_at: string | null;
  closes_at: string | null;
  status: "draft" | "open" | "closed" | "dispatched";
  collection_days: string[];
  created_at: string;
};

export const PRODUCT_CATEGORIES = [
  "dips",
  "breads",
  "savoury",
  "sweet",
  "other",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  dips: "Dips",
  breads: "Breads",
  savoury: "Savoury",
  sweet: "Sweet",
  other: "Other",
};

export type Product = {
  id: string;
  week_id: string;
  name: string;
  description: string | null;
  price: number;
  unit_label: string;
  max_qty: number | null;
  display_order: number;
  image_url: string | null;
  category: ProductCategory;
  created_at: string;
};

export type Customer = {
  id: string;
  name: string;
  whatsapp_number: string;
  is_on_account: boolean;
  account_balance: number;
  notes: string | null;
  created_at: string;
};

export type Order = {
  id: string;
  week_id: string;
  customer_id: string;
  collection_day: "friday" | "saturday";
  payment_status: "pending" | "paid" | "on_account";
  paid_at: string | null;
  notes: string | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
};

export type Collection = {
  id: string;
  week_id: string;
  collection_day: "friday" | "saturday";
  collection_date: string | null;
  collection_time: string | null;
  location: string | null;
  payment_instructions: string | null;
  created_at: string;
};

export type AccountTransaction = {
  id: string;
  customer_id: string;
  date: string;
  type: "credit" | "debit";
  amount: number;
  description: string | null;
  order_id: string | null;
  created_at: string;
};

// Joined types for common queries
export type OrderWithDetails = Order & {
  customer: Customer;
  order_items: (OrderItem & { product: Product })[];
};

export type WeekWithProducts = Week & {
  products: Product[];
};

export type CustomerWithTransactions = Customer & {
  account_transactions: AccountTransaction[];
};
