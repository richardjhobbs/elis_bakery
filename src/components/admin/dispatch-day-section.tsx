"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  saveCollectionDetails,
  markWeekDispatched,
} from "@/lib/actions/dispatch-actions";
import { formatCurrency, formatWhatsAppLink } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { Send, CheckCircle } from "lucide-react";
import type { PaymentStatus } from "@/lib/constants";

interface OrderRow {
  id: string;
  collection_day: string;
  payment_status: PaymentStatus;
  notes: string | null;
  customer: { name: string; whatsapp_number: string };
  order_item: { quantity: number; product: { name: string; price: number } }[];
}

interface CollectionRow {
  id: string;
  collection_day: string;
  collection_date: string | null;
  collection_time: string | null;
  location: string | null;
  payment_instructions: string | null;
}

interface Props {
  day: string;
  weekId: string;
  weekStatus: string;
  orders: OrderRow[];
  collection: CollectionRow | null;
}

function buildWhatsAppMessage(
  order: OrderRow,
  collection: CollectionRow | null
): string {
  const items = order.order_item
    .map(
      (item) =>
        `• ${item.product.name} ×${item.quantity} — ${formatCurrency(item.quantity * item.product.price)}`
    )
    .join("\n");

  const total = order.order_item.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0
  );

  let msg = `Hi ${order.customer.name} 👋 Your order from Eli's Artisan Bakery is ready!\n\n`;

  if (collection) {
    if (collection.collection_date || collection.collection_time) {
      msg += `🗓 Collection: ${order.collection_day.charAt(0).toUpperCase() + order.collection_day.slice(1)}`;
      if (collection.collection_date)
        msg += `, ${collection.collection_date}`;
      if (collection.collection_time)
        msg += ` at ${collection.collection_time}`;
      msg += "\n";
    }
    if (collection.location) {
      msg += `📍 ${collection.location}\n`;
    }
  }

  msg += `\nYour order:\n${items}\n\n💰 Total: ${formatCurrency(total)}`;

  if (order.payment_status === "on_account") {
    msg += "\nCharged to your account.";
  } else if (collection?.payment_instructions) {
    msg += `\nPayment: ${collection.payment_instructions}`;
  }

  msg += "\n\nThank you so much! 🧁";
  return msg;
}

export function DispatchDaySection({
  day,
  weekId,
  weekStatus,
  orders,
  collection,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleSaveDetails(formData: FormData) {
    setLoading(true);
    const result = await saveCollectionDetails(weekId, day, formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Collection details saved");
    }
    setLoading(false);
  }

  async function handleMarkDispatched() {
    if (!confirm("Mark all orders as dispatched?")) return;
    setLoading(true);
    const result = await markWeekDispatched(weekId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Week marked as dispatched");
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-brown-800 capitalize">
          {day}
        </h2>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Collection details form */}
        <form action={handleSaveDetails} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor={`date-${day}`}>Date</Label>
              <Input
                id={`date-${day}`}
                name="collection_date"
                type="date"
                defaultValue={collection?.collection_date || ""}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`time-${day}`}>Time</Label>
              <Input
                id={`time-${day}`}
                name="collection_time"
                defaultValue={collection?.collection_time || ""}
                placeholder="e.g. 10:00 AM – 12:00 PM"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`location-${day}`}>Location</Label>
            <Input
              id={`location-${day}`}
              name="location"
              defaultValue={collection?.location || ""}
              placeholder="Collection location"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`payment-${day}`}>Payment Instructions</Label>
            <Textarea
              id={`payment-${day}`}
              name="payment_instructions"
              defaultValue={collection?.payment_instructions || ""}
              placeholder="e.g. PayNow to 9123 4567 (Eli Lim)"
              rows={2}
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={loading}
            className="bg-brown-700 hover:bg-brown-800 text-cream-50"
          >
            Save Details
          </Button>
        </form>

        {/* Orders for this day */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Orders ({orders.length})
          </h3>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No orders for {day}.
            </p>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => {
                const total = order.order_item.reduce(
                  (sum, item) => sum + item.quantity * item.product.price,
                  0
                );
                const message = buildWhatsAppMessage(order, collection);
                const whatsappUrl = formatWhatsAppLink(
                  order.customer.whatsapp_number,
                  message
                );

                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-brown-800">
                        {order.customer.name}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {order.order_item
                          .map(
                            (i) => `${i.product.name} ×${i.quantity}`
                          )
                          .join(", ")}
                      </p>
                      <span className="text-sm font-semibold text-terracotta-600">
                        {formatCurrency(total)}
                      </span>
                    </div>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <Send className="h-3.5 w-3.5 mr-1" />
                        WhatsApp
                      </Button>
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {weekStatus === "closed" && orders.length > 0 && (
          <Button
            onClick={handleMarkDispatched}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="h-4 w-4 mr-1.5" />
            Mark All Dispatched
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
