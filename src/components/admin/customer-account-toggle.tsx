"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toggleOnAccount } from "@/lib/actions/customer-actions";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  customerId: string;
  isOnAccount: boolean;
}

export function CustomerAccountToggle({ customerId, isOnAccount }: Props) {
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(isOnAccount);

  async function handleToggle(value: boolean) {
    setLoading(true);
    setChecked(value);
    const result = await toggleOnAccount(customerId, value);
    if (result?.error) {
      toast.error(result.error);
      setChecked(!value);
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={checked}
        onCheckedChange={handleToggle}
        disabled={loading}
      />
      <Label className="text-sm">On Account</Label>
    </div>
  );
}
