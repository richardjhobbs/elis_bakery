"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { PaymentStatusSelect } from "@/components/admin/payment-status-select";
import { OrderNotes } from "@/components/admin/order-notes";
import { WhatsAppOrderButtons } from "@/components/admin/whatsapp-order-buttons";
import type { PaymentStatus } from "@/lib/constants";
import { DeleteOrderButton } from "@/components/admin/delete-order-button";
import { EditOrderDialog } from "@/components/admin/edit-order-dialog";

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

interface WeekProduct {
  id: string;
  name: string;
  price: number;
}

interface Props {
  orders: OrderRow[];
  weekId: string;
  collectionDays: string[];
  weekProducts?: WeekProduct[];
}

interface ConsolidatedProduct {
  name: string;
  price: number;
  totalQty: number;
  customers: { name: string; quantity: number; collectionDay: string }[];
}

function ConsolidatedView({ orders }: { orders: OrderRow[] }) {
  const productMap = new Map<string, ConsolidatedProduct>();

  orders.forEach((order) => {
    order.order_item.forEach((item) => {
      const key = item.product.name;
      if (!productMap.has(key)) {
        productMap.set(key, {
          name: item.product.name,
          price: item.product.price,
          totalQty: 0,
          customers: [],
        });
      }
      const entry = productMap.get(key)!;
      entry.totalQty += item.quantity;
      entry.customers.push({
        name: order.customer.name,
        quantity: item.quantity,
        collectionDay: order.collection_day,
      });
    });
  });

  const products = Array.from(productMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No orders yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <Card key={product.name}>
          <CardContent className="p-4">
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="font-semibold text-brown-800">{product.name}</h3>
              <div className="text-right">
                <span className="text-lg font-bold text-terracotta-600">
                  {product.totalQty}
                </span>
                <span className="text-sm text-muted-foreground ml-1">
                  total
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  ({formatCurrency(product.price)} each)
                </span>
              </div>
            </div>
            <div className="border-t pt-2 space-y-1">
              {product.customers.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground">{c.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground capitalize">
                      {c.collectionDay}
                    </span>
                    <span className="font-medium w-8 text-right">
                      ×{c.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function OrderDashboardClient({
  orders,
  weekId,
  collectionDays,
  weekProducts,
}: Props) {
  const [activeTab, setActiveTab] = useState("all");
  const [view, setView] = useState<"orders" | "consolidated">("orders");

  const filteredOrders =
    activeTab === "all"
      ? orders
      : orders.filter((o) => o.collection_day === activeTab);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {collectionDays.map((day) => (
              <TabsTrigger key={day} value={day} className="capitalize">
                {day}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Tabs value={view} onValueChange={(v) => setView(v as "orders" | "consolidated")}>
          <TabsList>
            <TabsTrigger value="orders">By Order</TabsTrigger>
            <TabsTrigger value="consolidated">Consolidated</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "consolidated" ? (
        <ConsolidatedView orders={filteredOrders} />
      ) : (
        <div className="space-y-3">
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
                          {order.paid_at && (
                            <span className="text-xs text-green-600">
                              {new Date(order.paid_at).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
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
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          <WhatsAppOrderButtons
                            customerName={order.customer.name}
                            whatsappNumber={order.customer.whatsapp_number}
                            items={order.order_item}
                            collectionDay={order.collection_day}
                            paymentStatus={order.payment_status}
                            total={orderTotal}
                          />
                          <EditOrderDialog
                            orderId={order.id}
                            weekId={weekId}
                            customerName={order.customer.name}
                            items={order.order_item}
                            weekProducts={weekProducts}
                          />
                          <DeleteOrderButton
                            orderId={order.id}
                            weekId={weekId}
                            customerName={order.customer.name}
                          />
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
      )}
    </div>
  );
}
