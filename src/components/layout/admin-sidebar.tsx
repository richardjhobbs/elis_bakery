"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Users,
  DollarSign,
  MessageCircle,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { href: "/admin/weeks", label: "Weeks", icon: CalendarDays },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign },
  { href: "/admin/broadcast", label: "Broadcast", icon: MessageCircle },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-brown-700 text-cream-50"
                : "text-brown-700 hover:bg-secondary"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile: hamburger + sheet */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 border-b bg-background px-4 py-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" />}
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-4">
            <div className="mb-6 flex items-center gap-3">
              <Image src="/logo.png" alt="Eli's Bakery" width={40} height={40} className="rounded-full" />
              <h2 className="font-display text-2xl text-brown-700">
                Eli&apos;s Bakery
              </h2>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <Image src="/logo.png" alt="Eli's Bakery" width={32} height={32} className="rounded-full" />
        <h1 className="font-display text-xl text-brown-700">
          Eli&apos;s Bakery
        </h1>
      </div>

      {/* Desktop: fixed sidebar */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 border-r bg-card">
        <div className="flex flex-col gap-6 p-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Eli's Bakery" width={44} height={44} className="rounded-full" />
            <div>
              <h2 className="font-display text-xl text-brown-700">
                Eli&apos;s Bakery
              </h2>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
          </div>
          <NavLinks />
        </div>
      </aside>
    </>
  );
}
