"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { formatCurrency } from "@/lib/utils";

interface CreateOrderInput {
  weekId: string;
  customerName: string;
  whatsappNumber: string;
  collectionDay: string;
  items: { product_id: string; quantity: number }[];
}

async function sendOrderNotification(
  input: CreateOrderInput,
) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return; // silently skip if not configured

  try {
    const supabase = await createClient();

    // Fetch product details for the order items
    const productIds = input.items.map((i) => i.product_id);
    const { data: products } = await supabase
      .from("product")
      .select("id, name, price")
      .in("id", productIds);

    const productMap = new Map(
      (products || []).map((p) => [p.id, p])
    );

    let total = 0;
    const itemLines = input.items
      .filter((i) => i.quantity > 0)
      .map((i) => {
        const p = productMap.get(i.product_id);
        const name = p?.name || "Unknown";
        const price = p?.price || 0;
        const lineTotal = i.quantity * price;
        total += lineTotal;
        return `${name} ×${i.quantity} — ${formatCurrency(lineTotal)}`;
      });

    const resend = new Resend(resendKey);

    await resend.emails.send({
      from: "Eli's Bakery Orders <onboarding@resend.dev>",
      to: [
        "wendynatalie@icloud.com",
        "teresa.hobson.hobbs@gmail.com",
      ],
      subject: `New order from ${input.customerName}`,
      html: `
        <h2>New Order Received</h2>
        <p><strong>Customer:</strong> ${input.customerName}</p>
        <p><strong>WhatsApp:</strong> ${input.whatsappNumber}</p>
        <p><strong>Collection:</strong> ${input.collectionDay}</p>
        <hr/>
        <p><strong>Items:</strong></p>
        <ul>${itemLines.map((l) => `<li>${l}</li>`).join("")}</ul>
        <p><strong>Total: ${formatCurrency(total)}</strong></p>
        <hr/>
        <p><a href="https://elisbakery.shop/admin/weeks/${input.weekId}/orders">View in admin</a></p>
      `,
    });
  } catch {
    // Don't let email failure break order placement
    console.error("Failed to send order notification email");
  }
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

  // Send email notification (fire and forget — don't block the response)
  sendOrderNotification(input);

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
