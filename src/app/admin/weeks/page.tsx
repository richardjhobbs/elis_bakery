import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WeekStatusBadge } from "@/components/shared/status-badge";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { CopyLinkButton } from "@/components/admin/copy-link-button";
import type { Week } from "@/lib/types/database";

export default async function WeeksPage() {
  const supabase = await createClient();
  const { data: weeks } = await supabase
    .from("week")
    .select("*")
    .order("closes_at", { ascending: false, nullsFirst: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brown-800">Weeks</h1>
        <Link href="/admin/weeks/new">
          <Button className="bg-brown-700 hover:bg-brown-800 text-cream-50">
            <Plus className="h-4 w-4 mr-1.5" />
            New Week
          </Button>
        </Link>
      </div>

      {!weeks || weeks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No weeks yet. Create your first week to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {weeks.map((week: Week) => (
            <Card key={week.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/admin/weeks/${week.id}`}
                        className="font-medium text-brown-800 hover:underline truncate"
                      >
                        {week.label}
                      </Link>
                      <WeekStatusBadge status={week.status} />
                    </div>
                    {week.closes_at && (
                      <p className="text-sm text-muted-foreground">
                        Closes {formatDate(week.closes_at)}
                      </p>
                    )}
                    {week.collection_days.length > 0 && (
                      <p className="text-sm text-muted-foreground capitalize">
                        Collection: {week.collection_days.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/admin/weeks/${week.id}`}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/admin/weeks/${week.id}/orders`}>
                      <Button variant="ghost" size="sm">
                        Orders
                      </Button>
                    </Link>
                    <CopyLinkButton weekId={week.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
