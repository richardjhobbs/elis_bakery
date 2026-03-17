import { createClient } from "@/lib/supabase/server";
import { CustomerListClient } from "@/components/admin/customer-list-client";
import type { Customer } from "@/lib/types/database";

export default async function CustomersPage() {
  const supabase = await createClient();

  const { data: customers } = await supabase
    .from("customer")
    .select("*")
    .order("name");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-brown-800">Customers</h1>
      <CustomerListClient customers={(customers || []) as Customer[]} />
    </div>
  );
}
