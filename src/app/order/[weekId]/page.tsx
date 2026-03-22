import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/layout/public-header";
import { OrderFormClient } from "@/components/order/order-form-client";
import { formatDate } from "@/lib/utils";
import type { Product } from "@/lib/types/database";
import { InstagramLink } from "@/components/ui/instagram-link";

export default async function OrderPage({
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

  // Week is not open
  if (week.status !== "open") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-4xl text-brown-700 mb-3">
          Eli&apos;s Artisan Bakery
        </h1>
        <p className="text-lg text-muted-foreground mb-2">
          Orders for this week are closed.
        </p>
        <p className="text-sm text-muted-foreground">
          Follow our WhatsApp group to hear about next week&apos;s bake!
        </p>
      </div>
    );
  }

  const { data: products } = await supabase
    .from("product")
    .select("*")
    .eq("week_id", params.weekId)
    .order("display_order");

  // Get total ordered quantities per product for sold-out detection
  const { data: orderItems } = await supabase
    .from("order_item")
    .select("product_id, quantity, order:order_id!inner(week_id)")
    .eq("order.week_id", params.weekId);

  const orderedTotals: Record<string, number> = {};
  (orderItems || []).forEach((item: { product_id: string; quantity: number }) => {
    orderedTotals[item.product_id] = (orderedTotals[item.product_id] || 0) + item.quantity;
  });

  // Build list of sold-out product IDs
  const soldOutIds = (products || [])
    .filter(
      (p: Product) =>
        p.max_qty !== null && (orderedTotals[p.id] || 0) >= p.max_qty
    )
    .map((p: Product) => p.id);

  return (
    <div className="min-h-screen bg-background pb-24 flex flex-col">
      <PublicHeader />

      <div className="max-w-lg mx-auto px-4 flex-1">
        {/* Week info */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-brown-800">
            {week.label}
          </h2>
          {week.closes_at && (
            <p className="text-sm text-muted-foreground">
              Orders close {formatDate(week.closes_at)}
            </p>
          )}
        </div>

        <OrderFormClient
          weekId={params.weekId}
          products={(products || []) as Product[]}
          collectionDays={week.collection_days}
          soldOutIds={soldOutIds}
        />
      </div>

      <footer className="text-center py-6">
        <InstagramLink />
      </footer>
    </div>
  );
}
