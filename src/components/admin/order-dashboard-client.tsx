"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatWhatsAppLink } from "@/lib/utils";
import { PaymentStatusSelect } from "@/components/admin/payment-status-select";
import { OrderNotes } from "@/components/admin/order-notes";
import { MessageCircle } from "lucide-react";
import type { PaymentStatus } from "@/lib/constants";

interface OrderItemRow {
  quantity: number;
  product: { name: string; price: number };
}

interface OrderRow {
  id: string;
  collection_day: string;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
  customer: { name: string; whatsapp_number: string };
  order_item: OrderItemRow[];
}

interface Props {
  orders: OrderRow[];
  weekId: string;
  collectionDays: string[];
}

export function OrderDashboardClient({
  orders,
  weekId,
  collectionDays,
}: Props) {
  const [activeTab, setActiveTab] = useState("all");

  const filteredOrders =
    activeTab === "all"
      ? orders
      : orders.filter((o) => o.collection_day === activeTab);

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {collectionDays.map((day) => (
            <TabsTrigger key={day} value={day} className="capitalize">
              {day}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-4 space-y-3">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No orders yet.
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => {
              const orderTotal = order.order_item.reduce(
                (sum, item) => sum + item.quantity * item.product.price,
                0
              );
              const itemsSummary = order.order_item
                .map((item) => `${item.product.name} ×${item.quantity}`)
                .join(", ");

              return (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-brown-800">
                            {order.customer.name}
                          </span>
                          <PaymentStatusSelect
                            orderId={order.id}
                            weekId={weekId}
                            currentStatus={order.payment_status}
                          />
                        </div>
                        <a
                          href={formatWhatsAppLink(
                            order.customer.whatsapp_number
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline"
                        >
                          <MessageCircle className="h-3 w-3" />
                          +65 {order.customer.whatsapp_number}
                        </a>
                        <p className="text-sm text-muted-foreground mt-1">
                          {itemsSummary}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-sm font-semibold text-terracotta-600">
                            {formatCurrency(orderTotal)}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {order.collection_day}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <OrderNotes
                          orderId={order.id}
                          weekId={weekId}
                          notes={order.notes}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </Tabs>
    </div>
  );
}
