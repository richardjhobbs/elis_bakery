"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { MessageCircle, Copy, Check, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface OrderItem {
  quantity: number;
  product: { name: string; price: number };
}

interface WhatsAppOrderButtonsProps {
  customerName: string;
  whatsappNumber: string;
  items: OrderItem[];
  collectionDay: string;
  paymentStatus: string;
  total: number;
}

function generateConfirmationMessage(
  customerName: string,
  items: OrderItem[],
  collectionDay: string,
  total: number
): string {
  const itemLines = items
    .map((item) => `  ${item.product.name} ×${item.quantity} — ${formatCurrency(item.quantity * item.product.price)}`)
    .join("\n");

  const day = collectionDay.charAt(0).toUpperCase() + collectionDay.slice(1);

  return `Hi ${customerName}

Thank you for your order this week:
${itemLines}

Total: ${formatCurrency(total)}

Collection: ${day} from 3pm to 5pm, at the usual address
Payment: Please pay via PayNow to mobile no. 9614 2321 and reference your payment as "bakery goods".
If possible, please send a screenshot when completed.

Many thanks
Wendy and Teresa
Eli's Artisan Bakery`;
}

function generateThankYouMessage(
  customerName: string,
  collectionDay: string
): string {
  const day = collectionDay.charAt(0).toUpperCase() + collectionDay.slice(1);

  return `Hi ${customerName}

Payment received — thank you!

Your order will be ready for collection on ${day} from 3pm to 5pm, at the usual address.

See you soon!
Wendy and Teresa
Eli's Artisan Bakery`;
}

function WhatsAppMessageSheet({
  open,
  onOpenChange,
  message,
  whatsappNumber,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  whatsappNumber: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);
  const [editedMessage, setEditedMessage] = useState(message);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    const encoded = encodeURIComponent(editedMessage);
    window.open(`https://web.whatsapp.com/send?phone=65${whatsappNumber}&text=${encoded}`, "_blank");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh]">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            Review and send via WhatsApp to +65 {whatsappNumber}
          </SheetDescription>
        </SheetHeader>
        <div className="p-4 space-y-4">
          <textarea
            value={editedMessage}
            onChange={(e) => setEditedMessage(e.target.value)}
            rows={8}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-3">
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
                  Copy
                </>
              )}
            </Button>
            <Button
              onClick={handleSend}
              className="flex-1 gap-2 bg-[#25D366] hover:bg-[#1da851] text-white"
            >
              <MessageCircle className="h-4 w-4" />
              Send via WhatsApp
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function WhatsAppOrderButtons({
  customerName,
  whatsappNumber,
  items,
  collectionDay,
  paymentStatus,
  total,
}: WhatsAppOrderButtonsProps) {
  const [confirmSheet, setConfirmSheet] = useState(false);
  const [thankYouSheet, setThankYouSheet] = useState(false);

  const confirmationMessage = generateConfirmationMessage(
    customerName,
    items,
    collectionDay,
    total
  );

  const thankYouMessage = generateThankYouMessage(customerName, collectionDay);

  return (
    <>
      <div className="flex items-center gap-1 mt-2">
        {/* Order confirmation + payment reminder */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 text-green-700 hover:text-green-800 hover:bg-green-50 px-2"
          onClick={() => setConfirmSheet(true)}
        >
          <MessageCircle className="h-3 w-3" />
          Confirm Order
        </Button>

        {/* Thank you message — shows when paid */}
        {paymentStatus === "paid" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-green-700 hover:text-green-800 hover:bg-green-50 px-2"
            onClick={() => setThankYouSheet(true)}
          >
            <MessageCircle className="h-3 w-3" />
            Thank You
          </Button>
        )}

        {/* Direct WhatsApp link */}
        <a
          href={`https://web.whatsapp.com/send?phone=65${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground px-2"
          >
            <ExternalLink className="h-3 w-3" />
            Chat
          </Button>
        </a>
      </div>

      <WhatsAppMessageSheet
        open={confirmSheet}
        onOpenChange={setConfirmSheet}
        message={confirmationMessage}
        whatsappNumber={whatsappNumber}
        title="Order Confirmation"
      />

      <WhatsAppMessageSheet
        open={thankYouSheet}
        onOpenChange={setThankYouSheet}
        message={thankYouMessage}
        whatsappNumber={whatsappNumber}
        title="Payment Thank You"
      />
    </>
  );
}
