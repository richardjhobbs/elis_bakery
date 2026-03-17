"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatWhatsAppLink } from "@/lib/utils";
import { MessageCircle } from "lucide-react";
import type { Customer } from "@/lib/types/database";

interface Props {
  customers: Customer[];
}

export function CustomerListClient({ customers }: Props) {
  const [filter, setFilter] = useState("all");

  const filtered = customers.filter((c) => {
    if (filter === "on_account") return c.is_on_account;
    if (filter === "owing") return c.account_balance < 0;
    return true;
  });

  return (
    <div>
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All ({customers.length})</TabsTrigger>
          <TabsTrigger value="on_account">
            On Account ({customers.filter((c) => c.is_on_account).length})
          </TabsTrigger>
          <TabsTrigger value="owing">
            Owing ({customers.filter((c) => c.account_balance < 0).length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4 space-y-2">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No customers found.
            </CardContent>
          </Card>
        ) : (
          filtered.map((customer) => (
            <Card key={customer.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="font-medium text-brown-800 hover:underline"
                      >
                        {customer.name}
                      </Link>
                      {customer.is_on_account && (
                        <Badge variant="secondary" className="text-xs">
                          On Account
                        </Badge>
                      )}
                    </div>
                    <a
                      href={formatWhatsAppLink(customer.whatsapp_number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline"
                    >
                      <MessageCircle className="h-3 w-3" />
                      +65 {customer.whatsapp_number}
                    </a>
                  </div>
                  {customer.is_on_account && (
                    <span
                      className={`font-semibold text-sm ${
                        customer.account_balance >= 0
                          ? "text-green-600"
                          : "text-destructive"
                      }`}
                    >
                      {formatCurrency(customer.account_balance)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
