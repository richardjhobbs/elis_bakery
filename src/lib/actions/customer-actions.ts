"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addPayment(customerId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const amount = parseFloat(formData.get("amount") as string);
  const description =
    (formData.get("description") as string) || "Payment received";

  // Create credit transaction
  const { error: txError } = await supabase
    .from("account_transaction")
    .insert({
      customer_id: customerId,
      type: "credit",
      amount,
      description,
    });

  if (txError) return { error: txError.message };

  // Update balance
  const { data: customer } = await supabase
    .from("customer")
    .select("account_balance")
    .eq("id", customerId)
    .single();

  if (customer) {
    await supabase
      .from("customer")
      .update({
        account_balance: customer.account_balance + amount,
      })
      .eq("id", customerId);
  }

  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/customers");
  return { success: true };
}

export async function updateCustomerNotes(
  customerId: string,
  notes: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("customer")
    .update({ notes })
    .eq("id", customerId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/customers/${customerId}`);
  return { success: true };
}

export async function toggleOnAccount(
  customerId: string,
  isOnAccount: boolean
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("customer")
    .update({ is_on_account: isOnAccount })
    .eq("id", customerId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/customers");
  return { success: true };
}
