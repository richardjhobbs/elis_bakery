"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Copy, Check, MessageCircle, ExternalLink } from "lucide-react";

type Product = {
  id: string;
  name: string;
  price: number;
  unit_label: string;
  description: string | null;
  display_order: number;
};

type WeekWithProducts = {
  id: string;
  label: string;
  status: string;
  collection_days: string[];
  products: Product[];
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://elis-bakery.vercel.app";

function generateMessage(week: WeekWithProducts): string {
  const orderUrl = `${SITE_URL}/order/${week.id}`;
  const collectionDays = week.collection_days
    .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
    .join(" & ");

  const productLines = [...week.products]
    .sort((a, b) => a.display_order - b.display_order)
    .map((p) => {
      const desc = p.description ? ` - ${p.description}` : "";
      return `  ${p.name} (${formatCurrency(p.price)}/${p.unit_label})${desc}`;
    })
    .join("\n");

  return `Hi everyone! This week's bakes are ready to order:\n\n${productLines}\n\nCollection: ${collectionDays}\n\nOrder here: ${orderUrl}\n\nThanks! Eli`;
}

export function BroadcastClient({ weeks }: { weeks: WeekWithProducts[] }) {
  const [selectedWeekId, setSelectedWeekId] = useState<string>(
    weeks[0]?.id || ""
  );
  const [copied, setCopied] = useState(false);
  const [customMessage, setCustomMessage] = useState<string | null>(null);

  const selectedWeek = weeks.find((w) => w.id === selectedWeekId);

  if (weeks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            No open or draft weeks available.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Create a week and add products first, then come back to broadcast.
          </p>
        </CardContent>
      </Card>
    );
  }

  const message = customMessage ?? (selectedWeek ? generateMessage(selectedWeek) : "");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppOpen = () => {
    // Opens WhatsApp with the message pre-filled
    // Using wa.me without a number opens "choose contact" in WhatsApp
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const handleReset = () => {
    setCustomMessage(null);
  };

  return (
    <div className="space-y-4">
      {/* Week selector */}
      {weeks.length > 1 && (
        <Card>
          <CardContent className="pt-4">
            <label className="text-sm font-medium text-brown-800 block mb-2">
              Select Week
            </label>
            <select
              value={selectedWeekId}
              onChange={(e) => {
                setSelectedWeekId(e.target.value);
                setCustomMessage(null);
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {weeks.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label} ({w.status})
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      {/* Message preview & editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-brown-800">
              Message Preview
            </h2>
            {selectedWeek && (
              <span className="text-xs text-muted-foreground">
                {selectedWeek.products.length} products
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={message}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={12}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-ring"
          />

          {customMessage !== null && (
            <button
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Reset to auto-generated message
            </button>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1 gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Message
                </>
              )}
            </Button>

            <Button
              onClick={handleWhatsAppOpen}
              className="flex-1 gap-2 bg-[#25D366] hover:bg-[#1da851] text-white"
            >
              <MessageCircle className="h-4 w-4" />
              Open in WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="text-sm font-medium text-brown-800 mb-2">
            How to broadcast
          </h3>
          <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
            <li>Review and edit the message above if needed</li>
            <li>
              Click{" "}
              <strong className="text-foreground">Open in WhatsApp</strong> to
              launch WhatsApp with the message pre-filled
            </li>
            <li>Select your broadcast list or group and send</li>
            <li>
              Or click <strong className="text-foreground">Copy Message</strong>{" "}
              to paste it manually
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Order link */}
      {selectedWeek && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-brown-800">
                  Direct Order Link
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 break-all">
                  {SITE_URL}/order/{selectedWeek.id}
                </p>
              </div>
              <a
                href={`${SITE_URL}/order/${selectedWeek.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <Button variant="ghost" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
