import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AddPaymentForm } from "@/components/admin/add-payment-form";
import { CustomerAccountToggle } from "@/components/admin/customer-account-toggle";
import type { AccountTransaction } from "@/lib/types/database";

interface OrderRow {
  id: string;
  collection_day: string;
  payment_status: string;
  created_at: string;
  week: { label: string };
  order_item: { quantity: number; product: { name: string; price: number } }[];
}

export default async function CustomerDetailPage({
  params,
}: {
  params: { customerId: string };
}) {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customer")
    .select("*")
    .eq("id", params.customerId)
    .single();

  if (!customer) notFound();

  const { data: rawTransactions } = await supabase
    .from("account_transaction")
    .select("*")
    .eq("customer_id", params.customerId)
    .order("created_at", { ascending: false });

  const transactions = (rawTransactions || []) as AccountTransaction[];

  const { data: rawOrders } = await supabase
    .from("order")
    .select(
      "id, collection_day, payment_status, created_at, week:week_id(label), order_item(quantity, product:product_id(name, price))"
    )
    .eq("customer_id", params.customerId)
    .order("created_at", { ascending: false });

  const orders = (rawOrders || []) as unknown as OrderRow[];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </Link>

      {/* Customer header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brown-800">
            {customer.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            +65 {customer.whatsapp_number}
          </p>
        </div>
        <CustomerAccountToggle
          customerId={customer.id}
          isOnAccount={customer.is_on_account}
        />
      </div>

      {/* Balance */}
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Account Balance</p>
          <p
            className={`text-3xl font-bold ${
              customer.account_balance >= 0
                ? "text-green-600"
                : "text-destructive"
            }`}
          >
            {formatCurrency(customer.account_balance)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {customer.account_balance >= 0 ? "In credit" : "Owes"}
          </p>
        </CardContent>
      </Card>

      {/* Add payment */}
      {customer.is_on_account && (
        <AddPaymentForm customerId={customer.id} />
      )}

      {/* Transaction history */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-brown-800">
            Transaction History
          </h2>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No transactions yet.
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 text-sm border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.date)}
                    </p>
                  </div>
                  <span
                    className={`font-semibold ${
                      tx.type === "credit"
                        ? "text-green-600"
                        : "text-destructive"
                    }`}
                  >
                    {tx.type === "credit" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order history */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-brown-800">Order History</h2>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No orders yet.
            </p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const total = order.order_item.reduce(
                  (sum, item) => sum + item.quantity * item.product.price,
                  0
                );
                return (
                  <div
                    key={order.id}
                    className="flex items-start justify-between gap-3 border-b pb-3 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {order.week?.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.order_item
                          .map(
                            (i) => `${i.product.name} ×${i.quantity}`
                          )
                          .join(", ")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-semibold">
                        {formatCurrency(total)}
                      </span>
                      <Badge
                        variant="secondary"
                        className="block mt-0.5 text-xs capitalize"
                      >
                        {order.payment_status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
