"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency } from "@/lib/utils";
import { createOrder } from "@/lib/actions/order-actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";

interface OrderCartProps {
  weekId: string;
  collectionDays: string[];
}

export function OrderCart({ weekId, collectionDays }: OrderCartProps) {
  const router = useRouter();
  const {
    items,
    customerName,
    whatsappNumber,
    collectionDay,
    getTotal,
    getItemCount,
  } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemCount = getItemCount();
  const total = getTotal();
  const effectiveCollectionDay =
    collectionDays.length === 1 ? collectionDays[0] : collectionDay;

  const isValid =
    itemCount > 0 &&
    customerName.trim().length > 0 &&
    /^\d{8}$/.test(whatsappNumber) &&
    effectiveCollectionDay.length > 0;

  async function handleSubmit() {
    if (!isValid) return;
    setLoading(true);
    setError(null);

    const orderItems = Object.values(items).map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
    }));

    const result = await createOrder({
      weekId,
      customerName: customerName.trim(),
      whatsappNumber,
      collectionDay: effectiveCollectionDay,
      items: orderItems,
    });

    if (result.error === "duplicate") {
      setError(
        "You've already placed an order this week. Please contact us via WhatsApp to make changes."
      );
      setLoading(false);
      return;
    }

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Redirect to confirmation
    router.push(`/order/${weekId}/confirmation?orderId=${result.orderId}`);
  }

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t shadow-lg">
      <div className="max-w-lg mx-auto px-4 py-3">
        {error && (
          <p className="text-sm text-destructive mb-2">{error}</p>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-terracotta-500" />
            <span className="text-sm font-medium">
              {itemCount} {itemCount === 1 ? "item" : "items"} &mdash;{" "}
              {formatCurrency(total)}
            </span>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="bg-terracotta-500 hover:bg-terracotta-600 text-white px-6"
          >
            {loading ? "Placing Order..." : "Place Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}
