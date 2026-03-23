"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Pencil, Minus, Plus } from "lucide-react";
import { updateOrderItems } from "@/lib/actions/order-actions";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface OrderItem {
  quantity: number;
  product: { name: string; price: number };
}

interface EditOrderDialogProps {
  orderId: string;
  weekId: string;
  customerName: string;
  items: OrderItem[];
  /** All products for this week so admin can add items */
  weekProducts?: { id: string; name: string; price: number }[];
}

export function EditOrderDialog({
  orderId,
  weekId,
  customerName,
  items,
  weekProducts,
}: EditOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Build editable items — start with existing order items, add any missing week products at qty 0
  const buildEditableItems = () => {
    const map = new Map<string, { name: string; price: number; quantity: number; product_id: string }>();

    // Add existing items
    items.forEach((item) => {
      map.set(item.product.name, {
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        product_id: "", // will be matched from weekProducts
      });
    });

    // Merge with week products to get product_ids and add missing products
    if (weekProducts) {
      weekProducts.forEach((wp) => {
        const existing = map.get(wp.name);
        if (existing) {
          existing.product_id = wp.id;
        } else {
          map.set(wp.name, {
            name: wp.name,
            price: wp.price,
            quantity: 0,
            product_id: wp.id,
          });
        }
      });
    }

    return Array.from(map.values());
  };

  const [editItems, setEditItems] = useState(buildEditableItems);

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      setEditItems(buildEditableItems());
    }
  }

  function updateQty(index: number, delta: number) {
    setEditItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      )
    );
  }

  async function handleSave() {
    const itemsToSave = editItems
      .filter((i) => i.quantity > 0 && i.product_id)
      .map((i) => ({ product_id: i.product_id, quantity: i.quantity }));

    if (itemsToSave.length === 0) {
      toast.error("Order must have at least one item.");
      return;
    }

    setLoading(true);
    const result = await updateOrderItems(orderId, weekId, itemsToSave);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Order updated");
      setOpen(false);
    }
    setLoading(false);
  }

  const total = editItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-7 text-xs gap-1 text-brown-700 hover:text-brown-800 hover:bg-brown-700/10 px-2"
      >
        <Pencil className="h-3 w-3" />
        Edit
      </Button>

      <Sheet open={open} onOpenChange={handleOpen}>
        <SheetContent side="bottom" className="max-h-[80vh]">
          <SheetHeader>
            <SheetTitle>Edit Order — {customerName}</SheetTitle>
            <SheetDescription>
              Adjust quantities or add/remove items
            </SheetDescription>
          </SheetHeader>
          <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
            {editItems.map((item, index) => (
              <div
                key={item.name}
                className={`flex items-center justify-between gap-3 py-2 ${
                  item.quantity === 0 ? "opacity-40" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatCurrency(item.price)}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => updateQty(index, -1)}
                    disabled={item.quantity === 0}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => updateQty(index, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">Total</span>
              <span className="font-semibold text-terracotta-600">
                {formatCurrency(total)}
              </span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-brown-700 hover:bg-brown-800 text-cream-50"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
