import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/layout/public-header";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, MessageCircle } from "lucide-react";
import { InstagramLink } from "@/components/ui/instagram-link";

interface OrderItemRow {
  quantity: number;
  product: { name: string; price: number; unit_label: string };
}

interface OrderCustomer {
  name: string;
  whatsapp_number: string;
}

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: { weekId: string };
  searchParams: { orderId?: string };
}) {
  if (!searchParams.orderId) notFound();

  const supabase = await createClient();

  const { data: order } = await supabase
    .from("order")
    .select(
      "*, customer:customer_id(name, whatsapp_number), order_item(quantity, product:product_id(name, price, unit_label))"
    )
    .eq("id", searchParams.orderId)
    .single();

  if (!order) notFound();

  const { data: week } = await supabase
    .from("week")
    .select("label")
    .eq("id", params.weekId)
    .single();

  const orderItems = (order.order_item as unknown as OrderItemRow[]) || [];
  const customer = order.customer as unknown as OrderCustomer;
  const total = orderItems.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <div className="max-w-lg mx-auto px-4 pb-12">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-brown-800">
            Order Placed!
          </h2>
          <p className="text-muted-foreground mt-1">
            Thank you, {customer?.name}
          </p>
        </div>

        {/* Order summary */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {week && (
              <div>
                <span className="text-sm text-muted-foreground">Week</span>
                <p className="font-medium">{week.label}</p>
              </div>
            )}

            <div>
              <span className="text-sm text-muted-foreground">
                Collection Day
              </span>
              <p className="font-medium capitalize">{order.collection_day}</p>
            </div>

            <div>
              <span className="text-sm text-muted-foreground">Your Order</span>
              <div className="mt-1 space-y-1">
                {orderItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>
                      {item.product.name} &times;{item.quantity}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(item.quantity * item.product.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-terracotta-600">
                {formatCurrency(total)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Thank you message */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-brown-800 font-medium">
            Thanks for your order
          </p>
          <p className="text-sm text-muted-foreground">
            We will be in touch soon with details for payment and collection.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Love from Wendy and Teresa
          </p>
        </div>

        {/* WhatsApp link */}
        <a
          href={`https://wa.me/65${customer?.whatsapp_number ? "" : ""}?text=${encodeURIComponent(
            `Hi! I've just placed an order (${formatCurrency(total)}).`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 w-full rounded-lg bg-[#25D366] hover:bg-[#1da851] text-white py-3 px-4 font-medium transition-colors"
        >
          <MessageCircle className="h-5 w-5" />
          Message us on WhatsApp
        </a>

        <div className="text-center mt-4">
          <InstagramLink />
        </div>
      </div>
    </div>
  );
}
