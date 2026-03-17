import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DispatchDaySection } from "@/components/admin/dispatch-day-section";
import type { PaymentStatus } from "@/lib/constants";

interface OrderRow {
  id: string;
  collection_day: string;
  payment_status: PaymentStatus;
  notes: string | null;
  customer: { name: string; whatsapp_number: string };
  order_item: { quantity: number; product: { name: string; price: number } }[];
}

interface CollectionRow {
  id: string;
  collection_day: string;
  collection_date: string | null;
  collection_time: string | null;
  location: string | null;
  payment_instructions: string | null;
}

export default async function DispatchPage({
  params,
}: {
  params: { weekId: string };
}) {
  const supabase = await createClient();

  const { data: week } = await supabase
    .from("week")
    .select("*")
    .eq("id", params.weekId)
    .single();

  if (!week) notFound();

  const { data: rawOrders } = await supabase
    .from("order")
    .select(
      "id, collection_day, payment_status, notes, customer:customer_id(name, whatsapp_number), order_item(quantity, product:product_id(name, price))"
    )
    .eq("week_id", params.weekId)
    .order("created_at");

  const orders = (rawOrders || []) as unknown as OrderRow[];

  const { data: rawCollections } = await supabase
    .from("collection")
    .select("*")
    .eq("week_id", params.weekId);

  const collections = (rawCollections || []) as unknown as CollectionRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/weeks/${params.weekId}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-semibold text-brown-800">
          Dispatch — {week.label}
        </h1>
      </div>

      {week.collection_days.map((day: string) => {
        const dayOrders = orders.filter((o) => o.collection_day === day);
        const dayCollection = collections.find(
          (c) => c.collection_day === day
        );
        return (
          <DispatchDaySection
            key={day}
            day={day}
            weekId={params.weekId}
            weekStatus={week.status}
            orders={dayOrders}
            collection={dayCollection || null}
          />
        );
      })}
    </div>
  );
}
