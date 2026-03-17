import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { OrderDashboardClient } from "@/components/admin/order-dashboard-client";
import type { PaymentStatus } from "@/lib/constants";

interface OrderItemRow {
  quantity: number;
  product: { name: string; price: number };
}

interface OrderRow {
  id: string;
  collection_day: string;
  payment_status: PaymentStatus;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  customer: { name: string; whatsapp_number: string };
  order_item: OrderItemRow[];
}

export default async function OrderDashboardPage({
  params,
}: {
  params: { weekId: string };
}) {
  const supabase = await createClient();

  const { data: week } = await supabase
    .from("week")
    .select("*")
    .eq("id", params.weekId)
    .single();

  if (!week) notFound();

  const { data: rawOrders } = await supabase
    .from("order")
    .select(
      "id, collection_day, payment_status, paid_at, notes, created_at, customer:customer_id(name, whatsapp_number), order_item(quantity, product:product_id(name, price))"
    )
    .eq("week_id", params.weekId)
    .order("created_at");

  const orders = (rawOrders || []) as unknown as OrderRow[];

  // Calculate summary stats
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => {
    const orderTotal = order.order_item.reduce(
      (s, item) => s + item.quantity * item.product.price,
      0
    );
    return sum + orderTotal;
  }, 0);

  const collected = orders
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, order) => {
      return (
        sum +
        order.order_item.reduce(
          (s, item) => s + item.quantity * item.product.price,
          0
        )
      );
    }, 0);

  // Product totals
  const productTotals: Record<string, number> = {};
  orders.forEach((order) => {
    order.order_item.forEach((item) => {
      productTotals[item.product.name] =
        (productTotals[item.product.name] || 0) + item.quantity;
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/weeks/${params.weekId}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-semibold text-brown-800">
          Orders — {week.label}
        </h1>
      </div>

      {/* Summary bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Orders:</span>{" "}
              <span className="font-semibold">{totalOrders}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Revenue:</span>{" "}
              <span className="font-semibold">
                {formatCurrency(totalRevenue)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Collected:</span>{" "}
              <span className="font-semibold text-green-600">
                {formatCurrency(collected)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Outstanding:</span>{" "}
              <span className="font-semibold text-amber-600">
                {formatCurrency(totalRevenue - collected)}
              </span>
            </div>
          </div>
          {/* Product chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(productTotals).map(([name, qty]) => (
              <Badge key={name} variant="secondary" className="text-xs">
                {name} &times;{qty}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <OrderDashboardClient
        orders={orders}
        weekId={params.weekId}
        collectionDays={week.collection_days}
      />
    </div>
  );
}
