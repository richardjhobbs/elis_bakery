"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface CreateOrderInput {
  weekId: string;
  customerName: string;
  whatsappNumber: string;
  collectionDay: string;
  items: { product_id: string; quantity: number }[];
}

export async function createOrder(input: CreateOrderInput) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_order_with_items", {
    p_week_id: input.weekId,
    p_customer_name: input.customerName,
    p_whatsapp_number: input.whatsappNumber,
    p_collection_day: input.collectionDay,
    p_notes: null,
    p_items: input.items,
  });

  if (error) {
    if (error.message.includes("already placed")) {
      return { error: "duplicate", orderId: null };
    }
    return { error: error.message, orderId: null };
  }

  revalidatePath(`/admin/weeks/${input.weekId}/orders`);
  return { error: null, orderId: data as string };
}

interface OrderItemWithProduct {
  quantity: number;
  product: { price: number };
}

export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: string,
  weekId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // If setting to on_account, create a debit transaction
  if (paymentStatus === "on_account") {
    const { data: order } = await supabase
      .from("order")
      .select(
        "id, customer_id, order_item(quantity, product:product_id(price))"
      )
      .eq("id", orderId)
      .single();

    if (order) {
      const items = order.order_item as unknown as OrderItemWithProduct[];
      const total = items.reduce(
        (sum, item) => sum + item.quantity * item.product.price,
        0
      );

      await supabase.from("account_transaction").insert({
        customer_id: order.customer_id,
        order_id: orderId,
        type: "debit",
        amount: total,
        description: "Order charged to account",
      });

      // Update balance
      const { data: customer } = await supabase
        .from("customer")
        .select("account_balance")
        .eq("id", order.customer_id)
        .single();

      if (customer) {
        await supabase
          .from("customer")
          .update({
            is_on_account: true,
            account_balance: customer.account_balance - total,
          })
          .eq("id", order.customer_id);
      }
    }
  }

  const { error } = await supabase
    .from("order")
    .update({ payment_status: paymentStatus })
    .eq("id", orderId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/weeks/${weekId}/orders`);
  return { success: true };
}

export async function updateOrderNotes(
  orderId: string,
  notes: string,
  weekId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("order")
    .update({ notes })
    .eq("id", orderId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/weeks/${weekId}/orders`);
  return { success: true };
}
