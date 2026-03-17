import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WeekStatusBadge } from "@/components/shared/status-badge";
import { WeekStatusControls } from "@/components/admin/week-status-controls";
import { ProductFormDialog } from "@/components/admin/product-form";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { CopyProductsButton } from "@/components/admin/copy-products-button";
import { WeekEditForm } from "@/components/admin/week-edit-form";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types/database";

export default async function WeekDetailPage({
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

  const { data: products } = await supabase
    .from("product")
    .select("*")
    .eq("week_id", params.weekId)
    .order("display_order");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/admin/weeks"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Weeks
      </Link>

      {/* Week header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-brown-800">
              {week.label}
            </h1>
            <WeekStatusBadge status={week.status} />
          </div>
        </div>
        <WeekStatusControls weekId={week.id} status={week.status} />
      </div>

      {/* Week details form */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-brown-800">Week Details</h2>
        </CardHeader>
        <CardContent>
          <WeekEditForm week={week} />
        </CardContent>
      </Card>

      {/* Products */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-brown-800">Products</h2>
            <div className="flex gap-2">
              <CopyProductsButton weekId={week.id} />
              <ProductFormDialog
                weekId={week.id}
                productCount={products?.length || 0}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!products || products.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">
              No products yet. Add products or copy from last week.
            </p>
          ) : (
            <div className="space-y-3">
              {products.map((product: Product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-brown-800">
                        {product.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(product.price)} {product.unit_label}
                      </span>
                    </div>
                    {product.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {product.description}
                      </p>
                    )}
                    {product.max_qty && (
                      <p className="text-xs text-amber-600">
                        Max: {product.max_qty}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <ProductFormDialog weekId={week.id} product={product} />
                    <DeleteProductButton
                      productId={product.id}
                      weekId={week.id}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
