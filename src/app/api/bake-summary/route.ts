import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import { PRODUCT_CATEGORIES, CATEGORY_LABELS } from "@/lib/types/database";
import type { ProductCategory } from "@/lib/types/database";

interface OrderItemRow {
  quantity: number;
  product: { name: string; price: number; category: string };
}

interface OrderRow {
  id: string;
  collection_day: string;
  order_item: OrderItemRow[];
}

type ItemInfo = { qty: number; category: ProductCategory };

function sortByCategory(entries: [string, ItemInfo][]) {
  return entries.sort((a, b) => {
    const catA = PRODUCT_CATEGORIES.indexOf(a[1].category as ProductCategory);
    const catB = PRODUCT_CATEGORIES.indexOf(b[1].category as ProductCategory);
    if (catA !== catB) return catA - catB;
    return a[0].localeCompare(b[0]);
  });
}

function renderItems(
  doc: jsPDF,
  items: [string, ItemInfo][],
  startY: number,
  pageWidth: number
): number {
  let y = startY;
  let currentCat = "";

  items.forEach(([name, info]) => {
    // Category sub-heading
    if (info.category !== currentCat) {
      currentCat = info.category;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(61, 117, 119);
      doc.text(
        CATEGORY_LABELS[info.category as ProductCategory] || info.category,
        22,
        y
      );
      y += 6;
    }

    // Item line
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.text(name, 28, y);
    doc.setFont("helvetica", "bold");
    doc.text(`× ${info.qty}`, pageWidth - 30, y, { align: "right" });

    // Checkbox
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.rect(pageWidth - 25, y - 4, 5, 5);

    y += 8;
  });

  return y;
}

export async function GET(request: NextRequest) {
  const weekId = request.nextUrl.searchParams.get("weekId");

  if (!weekId) {
    return NextResponse.json({ error: "weekId required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch week
  const { data: week } = await supabase
    .from("week")
    .select("*")
    .eq("id", weekId)
    .single();

  if (!week) {
    return NextResponse.json({ error: "Week not found" }, { status: 404 });
  }

  // Fetch orders with items (including category)
  const { data: rawOrders } = await supabase
    .from("order")
    .select(
      "id, collection_day, order_item(quantity, product:product_id(name, price, category))"
    )
    .eq("week_id", weekId)
    .order("created_at");

  const orders = (rawOrders || []) as unknown as OrderRow[];

  // Build summary data: totals per product, split by day
  const dayTotals: Record<string, Record<string, ItemInfo>> = {};
  const overallTotals: Record<string, ItemInfo> = {};

  orders.forEach((order) => {
    const day = order.collection_day || "Unspecified";
    if (!dayTotals[day]) dayTotals[day] = {};

    order.order_item.forEach((item) => {
      const name = item.product.name;
      const cat = (item.product.category || "other") as ProductCategory;

      if (!dayTotals[day][name]) {
        dayTotals[day][name] = { qty: 0, category: cat };
      }
      dayTotals[day][name].qty += item.quantity;

      if (!overallTotals[name]) {
        overallTotals[name] = { qty: 0, category: cat };
      }
      overallTotals[name].qty += item.quantity;
    });
  });

  const collectionDays = Object.keys(dayTotals).sort();
  const hasMultipleDays = collectionDays.length > 1;

  // Generate PDF
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(61, 117, 119);
  doc.text("Eli's Artisan Bakery", pageWidth / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(16);
  doc.setTextColor(45, 95, 97);
  doc.text(`Bake Summary — ${week.label}`, pageWidth / 2, y, {
    align: "center",
  });
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}  •  Total orders: ${orders.length}`,
    pageWidth / 2,
    y,
    { align: "center" }
  );
  y += 8;

  // Divider
  doc.setDrawColor(61, 117, 119);
  doc.setLineWidth(0.5);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  // If multiple collection days, show per-day breakdown
  if (hasMultipleDays) {
    collectionDays.forEach((day) => {
      const items = dayTotals[day];
      const sorted = sortByCategory(Object.entries(items));

      // Day heading
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(61, 117, 119);
      doc.text(day.charAt(0).toUpperCase() + day.slice(1), 20, y);
      y += 2;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(20, y, pageWidth - 20, y);
      y += 7;

      y = renderItems(doc, sorted, y, pageWidth);
      y += 4;
    });

    // Overall totals divider
    doc.setDrawColor(61, 117, 119);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);
    y += 10;
  }

  // Overall totals heading
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(61, 117, 119);
  doc.text(hasMultipleDays ? "TOTAL TO BAKE" : "What to Bake", 20, y);
  y += 3;
  doc.setDrawColor(61, 117, 119);
  doc.setLineWidth(0.4);
  doc.line(20, y, pageWidth - 20, y);
  y += 9;

  const sortedOverall = sortByCategory(Object.entries(overallTotals));
  y = renderItems(doc, sortedOverall, y, pageWidth);

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Bake-Summary-${week.label.replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
