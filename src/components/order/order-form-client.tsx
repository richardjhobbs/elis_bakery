"use client";

import { ProductCard } from "@/components/order/product-card";
import { CustomerInfoForm } from "@/components/order/customer-info-form";
import { OrderCart } from "@/components/order/order-cart";
import { useCart } from "@/hooks/use-cart";
import { useEffect } from "react";
import type { Product } from "@/lib/types/database";

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
      {/* Product list */}
      <div className="space-y-3 mb-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Customer details */}
      <CustomerInfoForm collectionDays={collectionDays} />

      {/* Sticky cart bar */}
      <OrderCart weekId={weekId} collectionDays={collectionDays} />
    </>
  );
}
