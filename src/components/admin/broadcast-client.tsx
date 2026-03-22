"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import {
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  Monitor,
  Megaphone,
  Share2,
} from "lucide-react";
import {
  PRODUCT_CATEGORIES,
  CATEGORY_LABELS,
  type ProductCategory,
} from "@/lib/types/database";

type Product = {
  id: string;
  name: string;
  price: number;
  unit_label: string;
  display_order: number;
  category: ProductCategory;
};

type WeekWithProducts = {
  id: string;
  label: string;
  status: string;
  collection_days: string[];
  products: Product[];
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://elisbakery.shop";

type TemplateType = "announcement" | "marketing";

function generateAnnouncement(week: WeekWithProducts): string {
  const orderUrl = `${SITE_URL}/order/${week.id}`;
  const collectionDays = week.collection_days
    .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
    .join(" & ");

  const sections = PRODUCT_CATEGORIES.map((cat) => {
    const catProducts = week.products
      .filter((p) => p.category === cat)
      .sort((a, b) => a.display_order - b.display_order);
    if (catProducts.length === 0) return "";
    const header = `*${CATEGORY_LABELS[cat]}*`;
    const lines = catProducts
      .map((p) => `🧁 ${p.name} (${formatCurrency(p.price)}/${p.unit_label})`)
      .join("\n");
    return `${header}\n${lines}`;
  })
    .filter(Boolean)
    .join("\n\n");

  return `Hi everyone! 🎉 This week's bakes are ready to order:\n\n${sections}\n\n📅 Collection: ${collectionDays}\n\n👉 Order here: ${orderUrl}\n\nThanks! Teresa and Wendy 👩‍🍳`;
}

function generateMarketing(week: WeekWithProducts): string {
  const orderUrl = `${SITE_URL}/order/${week.id}`;

  return `Hey! Know someone who loves freshly baked treats? 🧁\n\nEli's Artisan Bakery does weekly bakes — handmade sourdough, pastries, and more!\n\nThis week's menu is live. Share the love and send them the link:\n\n👉 ${orderUrl}\n\nThanks for spreading the word! ❤️`;
}

function MessageEditor({
  message,
  onMessageChange,
  onReset,
  showReset,
  label,
}: {
  message: string;
  onMessageChange: (msg: string) => void;
  onReset: () => void;
  showReset: boolean;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppOpen = () => {
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-medium text-brown-800">{label}</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <textarea
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          rows={10}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {showReset && (
          <button
            onClick={onReset}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Reset to auto-generated message
          </button>
        )}

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
  );
}

export function BroadcastClient({ weeks }: { weeks: WeekWithProducts[] }) {
  const [selectedWeekId, setSelectedWeekId] = useState<string>(
    weeks[0]?.id || ""
  );
  const [template, setTemplate] = useState<TemplateType>("announcement");
  const [customMessages, setCustomMessages] = useState<
    Record<string, Record<TemplateType, string | null>>
  >({});

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

  const getAutoMessage = (week: WeekWithProducts, tmpl: TemplateType) => {
    switch (tmpl) {
      case "announcement":
        return generateAnnouncement(week);
      case "marketing":
        return generateMarketing(week);
    }
  };

  const currentCustom =
    customMessages[selectedWeekId]?.[template] ?? null;
  const message = selectedWeek
    ? currentCustom ?? getAutoMessage(selectedWeek, template)
    : "";

  const setCustomMessage = (msg: string) => {
    setCustomMessages((prev) => ({
      ...prev,
      [selectedWeekId]: {
        ...prev[selectedWeekId],
        [template]: msg,
      },
    }));
  };

  const resetMessage = () => {
    setCustomMessages((prev) => ({
      ...prev,
      [selectedWeekId]: {
        ...prev[selectedWeekId],
        [template]: null,
      },
    }));
  };

  const templateLabels: Record<TemplateType, { label: string; icon: React.ReactNode }> = {
    announcement: { label: "Weekly Announcement", icon: <Megaphone className="h-4 w-4" /> },
    marketing: { label: "Share & Refer", icon: <Share2 className="h-4 w-4" /> },
  };

  return (
    <div className="space-y-4">
      {/* WhatsApp Desktop link */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                <Monitor className="h-5 w-5 text-[#25D366]" />
              </div>
              <div>
                <p className="text-sm font-medium text-brown-800">
                  WhatsApp Desktop
                </p>
                <p className="text-xs text-muted-foreground">
                  Open WhatsApp on this computer
                </p>
              </div>
            </div>
            <a
              href="https://web.whatsapp.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-3.5 w-3.5" />
                Open
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

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

      {/* Template tabs */}
      <Tabs
        value={template}
        onValueChange={(v) => setTemplate(v as TemplateType)}
      >
        <TabsList className="w-full">
          {Object.entries(templateLabels).map(([key, { label, icon }]) => (
            <TabsTrigger key={key} value={key} className="flex-1 gap-1.5">
              {icon}
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">
                {key === "announcement" ? "Announce" : "Share"}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Message editor */}
      <MessageEditor
        message={message}
        onMessageChange={setCustomMessage}
        onReset={resetMessage}
        showReset={currentCustom !== null}
        label={templateLabels[template].label}
      />

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

      {/* Instructions */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="text-sm font-medium text-brown-800 mb-2">
            How to broadcast
          </h3>
          <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
            <li>Open WhatsApp Desktop above (keeps messages in sync with your phone)</li>
            <li>Review and edit the message if needed</li>
            <li>
              Click{" "}
              <strong className="text-foreground">Open in WhatsApp</strong> to
              send to your broadcast list or group
            </li>
            <li>
              Or <strong className="text-foreground">Copy Message</strong>{" "}
              to paste manually
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
