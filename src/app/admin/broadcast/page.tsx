import { createClient } from "@/lib/supabase/server";
import { BroadcastClient } from "@/components/admin/broadcast-client";

export default async function BroadcastPage() {
  const supabase = await createClient();

  // Get all open weeks with their products
  const { data: weeks } = await supabase
    .from("week")
    .select("*, products:product(id, name, price, unit_label, display_order, category)")
    .in("status", ["open", "draft"])
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-brown-800">
        WhatsApp Broadcast
      </h1>
      <BroadcastClient weeks={weeks || []} />
    </div>
  );
}
