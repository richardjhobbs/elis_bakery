"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function uploadProductImage(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  if (!file || file.size === 0) return { error: "No file provided" };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(fileName, file, { contentType: file.type });

  if (error) return { error: error.message };

  const { data: urlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(fileName);

  return { url: urlData.publicUrl };
}

export async function createWeek(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const label = formData.get("label") as string;
  const opens_at = formData.get("opens_at") as string;
  const closes_at = formData.get("closes_at") as string;
  const collection_days = formData.getAll("collection_days") as string[];

  const { data, error } = await supabase
    .from("week")
    .insert({
      label,
      opens_at: opens_at || null,
      closes_at: closes_at || null,
      collection_days,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  redirect(`/admin/weeks/${data.id}`);
}

export async function updateWeek(weekId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const label = formData.get("label") as string;
  const opens_at = formData.get("opens_at") as string;
  const closes_at = formData.get("closes_at") as string;
  const collection_days = formData.getAll("collection_days") as string[];

  const { error } = await supabase
    .from("week")
    .update({
      label,
      opens_at: opens_at || null,
      closes_at: closes_at || null,
      collection_days,
    })
    .eq("id", weekId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/weeks/${weekId}`);
  revalidatePath("/admin/weeks");
  return { success: true };
}

export async function updateWeekStatus(weekId: string, status: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // If opening a week, check no other week is open
  if (status === "open") {
    const { data: openWeeks } = await supabase
      .from("week")
      .select("id, label")
      .eq("status", "open")
      .neq("id", weekId);

    if (openWeeks && openWeeks.length > 0) {
      return {
        error: `"${openWeeks[0].label}" is already open. Close it before opening another week.`,
      };
    }
  }

  const { error } = await supabase
    .from("week")
    .update({ status })
    .eq("id", weekId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/weeks/${weekId}`);
  revalidatePath("/admin/weeks");
  return { success: true };
}

export async function deleteWeek(weekId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("week").delete().eq("id", weekId);

  if (error) return { error: error.message };

  revalidatePath("/admin/weeks");
  redirect("/admin/weeks");
}

export async function addProduct(weekId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const price = parseFloat(formData.get("price") as string);
  const unit_label = formData.get("unit_label") as string;
  const max_qty_str = formData.get("max_qty") as string;
  const max_qty = max_qty_str ? parseInt(max_qty_str) : null;
  const display_order = parseInt(
    (formData.get("display_order") as string) || "0"
  );
  const image_url = (formData.get("image_url") as string) || null;

  const { error } = await supabase.from("product").insert({
    week_id: weekId,
    name,
    description,
    price,
    unit_label,
    max_qty,
    display_order,
    image_url,
  });

  if (error) return { error: error.message };

  revalidatePath(`/admin/weeks/${weekId}`);
  return { success: true };
}

export async function updateProduct(
  productId: string,
  weekId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const price = parseFloat(formData.get("price") as string);
  const unit_label = formData.get("unit_label") as string;
  const max_qty_str = formData.get("max_qty") as string;
  const max_qty = max_qty_str ? parseInt(max_qty_str) : null;
  const display_order = parseInt(
    (formData.get("display_order") as string) || "0"
  );
  const image_url = (formData.get("image_url") as string) || null;

  const { error } = await supabase
    .from("product")
    .update({ name, description, price, unit_label, max_qty, display_order, image_url })
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/weeks/${weekId}`);
  return { success: true };
}

export async function deleteProduct(productId: string, weekId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("product")
    .delete()
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/weeks/${weekId}`);
  return { success: true };
}

export async function copyProductsFromLastWeek(weekId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Find the most recent week before this one that has products
  const { data: currentWeek } = await supabase
    .from("week")
    .select("created_at")
    .eq("id", weekId)
    .single();

  if (!currentWeek) return { error: "Week not found" };

  const { data: previousWeeks } = await supabase
    .from("week")
    .select("id")
    .lt("created_at", currentWeek.created_at)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!previousWeeks || previousWeeks.length === 0) {
    return { error: "No previous week found" };
  }

  const { data: products } = await supabase
    .from("product")
    .select("name, description, price, unit_label, max_qty, display_order, image_url")
    .eq("week_id", previousWeeks[0].id)
    .order("display_order");

  if (!products || products.length === 0) {
    return { error: "No products found in previous week" };
  }

  const { error } = await supabase.from("product").insert(
    products.map((p) => ({
      ...p,
      week_id: weekId,
    }))
  );

  if (error) return { error: error.message };

  revalidatePath(`/admin/weeks/${weekId}`);
  return { success: true, count: products.length };
}
