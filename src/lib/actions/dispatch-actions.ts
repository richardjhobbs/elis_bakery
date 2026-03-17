"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveCollectionDetails(
  weekId: string,
  collectionDay: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const collection_date = formData.get("collection_date") as string;
  const collection_time = formData.get("collection_time") as string;
  const location = formData.get("location") as string;
  const payment_instructions = formData.get("payment_instructions") as string;

  const { error } = await supabase.from("collection").upsert(
    {
      week_id: weekId,
      collection_day: collectionDay,
      collection_date: collection_date || null,
      collection_time: collection_time || null,
      location: location || null,
      payment_instructions: payment_instructions || null,
    },
    { onConflict: "week_id,collection_day" }
  );

  if (error) return { error: error.message };

  revalidatePath(`/admin/weeks/${weekId}/dispatch`);
  return { success: true };
}

export async function markWeekDispatched(weekId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("week")
    .update({ status: "dispatched" })
    .eq("id", weekId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/weeks/${weekId}`);
  revalidatePath(`/admin/weeks/${weekId}/dispatch`);
  revalidatePath("/admin/weeks");
  return { success: true };
}
