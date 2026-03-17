import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

interface WeekRow {
  id: string;
  label: string;
  status: string;
}

interface OrderRow {
  week_id: string;
  payment_status: string;
  order_item: { quantity: number; product: { name: string; price: number } }[];
}

export default async function RevenuePage() {
  const supabase = await createClient();

  const { data: weeks } = await supabase
    .from("week")
    .select("id, label, status, created_at")
    .order("created_at", { ascending: false });

  const { data: rawOrders } = await supabase
    .from("order")
    .select(
      "week_id, payment_status, order_item(quantity, product:product_id(name, price))"
    );

  const orders = (rawOrders || []) as unknown as OrderRow[];

  // Build weekly stats
  const weeklyStats = (weeks || []).map((week: WeekRow & { created_at: string }) => {
    const weekOrders = orders.filter((o) => o.week_id === week.id);
    const orderCount = weekOrders.length;

    let gross = 0;
    let collected = 0;
    const productCounts: Record<string, number> = {};

    weekOrders.forEach((order) => {
      const orderTotal = order.order_item.reduce((sum, item) => {
        productCounts[item.product.name] =
          (productCounts[item.product.name] || 0) + item.quantity;
        return sum + item.quantity * item.product.price;
      }, 0);
      gross += orderTotal;
      if (order.payment_status === "paid") {
        collected += orderTotal;
      }
    });

    const topItems = Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, qty]) => `${name} ×${qty}`)
      .join(", ");

    return {
      label: week.label,
      orderCount,
      topItems,
      gross,
      collected,
      outstanding: gross - collected,
      created_at: week.created_at,
    };
  });

  // Monthly rollup
  const monthlyMap = new Map<
    string,
    { weeks: number; orders: number; gross: number; collected: number }
  >();
  weeklyStats.forEach((w) => {
    const month = new Date(w.created_at).toLocaleDateString("en-SG", {
      month: "long",
      year: "numeric",
    });
    const existing = monthlyMap.get(month) || {
      weeks: 0,
      orders: 0,
      gross: 0,
      collected: 0,
    };
    monthlyMap.set(month, {
      weeks: existing.weeks + 1,
      orders: existing.orders + w.orderCount,
      gross: existing.gross + w.gross,
      collected: existing.collected + w.collected,
    });
  });

  // All-time
  const allTime = weeklyStats.reduce(
    (acc, w) => ({
      gross: acc.gross + w.gross,
      collected: acc.collected + w.collected,
      orders: acc.orders + w.orderCount,
    }),
    { gross: 0, collected: 0, orders: 0 }
  );

  // Outstanding on-account
  const { data: owingCustomers } = await supabase
    .from("customer")
    .select("account_balance")
    .eq("is_on_account", true)
    .lt("account_balance", 0);

  const totalOnAccountOutstanding = (owingCustomers || []).reduce(
    (sum, c) => sum + Math.abs(c.account_balance),
    0
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-brown-800">Revenue</h1>

      {/* All-time summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: formatCurrency(allTime.gross),
          },
          {
            label: "Collected",
            value: formatCurrency(allTime.collected),
            color: "text-green-600",
          },
          {
            label: "On-Account Outstanding",
            value: formatCurrency(totalOnAccountOutstanding),
            color: "text-amber-600",
          },
          { label: "Total Orders", value: allTime.orders.toString() },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p
                className={`text-xl font-bold ${stat.color || "text-brown-800"}`}
              >
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly view */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-brown-800">Weekly</h2>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead>Top Items</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Collected</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeklyStats.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    No data yet.
                  </TableCell>
                </TableRow>
              ) : (
                weeklyStats.map((w) => (
                  <TableRow key={w.label}>
                    <TableCell className="font-medium">{w.label}</TableCell>
                    <TableCell className="text-right">
                      {w.orderCount}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {w.topItems}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(w.gross)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(w.collected)}
                    </TableCell>
                    <TableCell className="text-right text-amber-600">
                      {formatCurrency(w.outstanding)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Monthly rollup */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-brown-800">Monthly</h2>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Weeks</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Collected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyMap.size === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    No data yet.
                  </TableCell>
                </TableRow>
              ) : (
                Array.from(monthlyMap.entries()).map(([month, stats]) => (
                  <TableRow key={month}>
                    <TableCell className="font-medium">{month}</TableCell>
                    <TableCell className="text-right">
                      {stats.weeks}
                    </TableCell>
                    <TableCell className="text-right">
                      {stats.orders}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(stats.gross)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(stats.collected)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
