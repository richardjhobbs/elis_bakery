"use client";

import { ProductCard } from "@/components/order/product-card";
import { CustomerInfoForm } from "@/components/order/customer-info-form";
import { OrderCart } from "@/components/order/order-cart";
import { useCart } from "@/hooks/use-cart";
import { useEffect } from "react";
import {
  PRODUCT_CATEGORIES,
  CATEGORY_LABELS,
  type Product,
} from "@/lib/types/database";

interface OrderFormClientProps {
  weekId: string;
  products: Product[];
  collectionDays: string[];
}

export function OrderFormClient({
  weekId,
  products,
  collectionDays,
}: OrderFormClientProps) {
  const { setCollectionDay, reset } = useCart();

  // Auto-set collection day if only one option
  useEffect(() => {
    if (collectionDays.length === 1) {
      setCollectionDay(collectionDays[0]);
    }
  }, [collectionDays, setCollectionDay]);

  // Reset cart on unmount
  useEffect(() => {
    return () => reset();
  }, [reset]);

  return (
    <>
      {/* Product list grouped by category */}
      <div className="space-y-6 mb-6">
        {PRODUCT_CATEGORIES.map((cat) => {
          const catProducts = products.filter((p) => p.category === cat);
          if (catProducts.length === 0) return null;
          return (
            <div key={cat}>
              <h3 className="text-lg font-semibold text-brown-700 border-b border-border pb-1 mb-3">
                {CATEGORY_LABELS[cat]}
              </h3>
              <div className="space-y-3">
                {catProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer details */}
      <CustomerInfoForm collectionDays={collectionDays} />

      {/* Sticky cart bar */}
      <OrderCart weekId={weekId} collectionDays={collectionDays} />
    </>
  );
}
