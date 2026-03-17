"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
import type { Product } from "@/lib/types/database";

export function ProductCard({ product }: { product: Product }) {
  const { items, setQuantity } = useCart();
  const currentQty = items[product.id]?.quantity || 0;
  const lineTotal = currentQty * product.price;

  function increment() {
    if (product.max_qty && currentQty >= product.max_qty) return;
    setQuantity(product.id, currentQty + 1, product.price, product.name);
  }

  function decrement() {
    setQuantity(product.id, currentQty - 1, product.price, product.name);
  }

  return (
    <Card className={currentQty > 0 ? "ring-2 ring-terracotta-400/50" : ""}>
      <CardContent className="p-4">
        {/* Product image */}
        <div className="relative w-full h-36 rounded-lg overflow-hidden mb-3 bg-cream-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cream-100 to-cream-200">
              <span className="font-display text-2xl text-brown-400/70 italic">
                Just Imagine!
              </span>
            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-brown-800 text-lg">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {product.description}
              </p>
            )}
            <p className="text-terracotta-600 font-medium mt-1">
              {formatCurrency(product.price)}{" "}
              <span className="text-sm text-muted-foreground font-normal">
                {product.unit_label}
              </span>
            </p>
            {product.max_qty && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Max {product.max_qty} per order
              </p>
            )}
          </div>

          {/* Quantity selector */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={decrement}
              disabled={currentQty === 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-semibold text-lg tabular-nums">
              {currentQty}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={increment}
              disabled={
                product.max_qty !== null && currentQty >= product.max_qty
              }
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {currentQty > 0 && (
          <div className="mt-2 text-right text-sm font-medium text-terracotta-600">
            {formatCurrency(lineTotal)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
