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

  const updateData: Record<string, unknown> = { payment_status: paymentStatus };
  if (paymentStatus === "paid") {
    updateData.paid_at = new Date().toISOString();
  } else {
    updateData.paid_at = null;
  }

  const { error } = await supabase
    .from("order")
    .update(updateData)
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

export async function deleteOrder(orderId: string, weekId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("order").delete().eq("id", orderId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/weeks/${weekId}/orders`);
  return { success: true };
}

export async function updateOrderItems(
  orderId: string,
  weekId: string,
  items: { product_id: string; quantity: number }[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Delete existing items
  const { error: deleteError } = await supabase
    .from("order_item")
    .delete()
    .eq("order_id", orderId);

  if (deleteError) return { error: deleteError.message };

  // Insert new items (only non-zero quantities)
  const newItems = items
    .filter((i) => i.quantity > 0)
    .map((i) => ({
      order_id: orderId,
      product_id: i.product_id,
      quantity: i.quantity,
    }));

  if (newItems.length === 0) {
    return { error: "Order must have at least one item." };
  }

  const { error: insertError } = await supabase
    .from("order_item")
    .insert(newItems);

  if (insertError) return { error: insertError.message };

  revalidatePath(`/admin/weeks/${weekId}/orders`);
  return { success: true };
}
