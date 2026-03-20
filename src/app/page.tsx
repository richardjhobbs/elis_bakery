import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();

  // Find the currently open week
  const { data: openWeek } = await supabase
    .from("week")
    .select("id, label")
    .eq("status", "open")
    .limit(1)
    .single();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <Image
          src="/logo.jpg"
          alt="Eli's Artisan Bakery logo"
          width={160}
          height={160}
          className="rounded-full mb-6"
          priority
        />
        <h1 className="font-display text-6xl md:text-7xl text-brown-700 mb-3">
          Eli&apos;s Artisan Bakery
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mb-8">
          Fresh artisan bakes made with love, available for weekly collection in
          Singapore.
        </p>

        {openWeek ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{openWeek.label}</p>
            <Link href={`/order/${openWeek.id}`}>
              <Button
                size="lg"
                className="bg-terracotta-500 hover:bg-terracotta-600 text-white text-lg px-8 py-6 rounded-full"
              >
                Order Now
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <p className="text-muted-foreground">
            No orders this week — follow our WhatsApp group for updates!
          </p>
        )}
      </main>

      <footer className="text-center py-6 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Eli&apos;s Artisan Bakery
      </footer>
    </div>
  );
}
