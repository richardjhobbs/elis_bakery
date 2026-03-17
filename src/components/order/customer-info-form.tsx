"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/hooks/use-cart";

interface CustomerInfoFormProps {
  collectionDays: string[];
}

export function CustomerInfoForm({ collectionDays }: CustomerInfoFormProps) {
  const {
    customerName,
    whatsappNumber,
    collectionDay,
    setCustomerName,
    setWhatsappNumber,
    setCollectionDay,
  } = useCart();

  return (
    <div className="space-y-4 bg-card rounded-lg border p-4">
      <h3 className="font-semibold text-brown-800">Your Details</h3>

      <div className="space-y-2">
        <Label htmlFor="customerName">Name</Label>
        <Input
          id="customerName"
          placeholder="Your name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            +65
          </span>
          <Input
            id="whatsappNumber"
            placeholder="8 digits"
            value={whatsappNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 8);
              setWhatsappNumber(val);
            }}
            inputMode="numeric"
            maxLength={8}
            required
          />
        </div>
      </div>

      {collectionDays.length > 1 && (
        <div className="space-y-2">
          <Label>Collection Day</Label>
          <div className="flex gap-3">
            {collectionDays.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setCollectionDay(day)}
                className={`flex-1 rounded-lg border-2 py-3 text-center text-sm font-medium capitalize transition-colors ${
                  collectionDay === day
                    ? "border-terracotta-500 bg-terracotta-500/10 text-terracotta-600"
                    : "border-border hover:bg-secondary"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
