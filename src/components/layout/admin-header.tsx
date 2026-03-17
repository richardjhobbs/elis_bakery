"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth-actions";

export function AdminHeader() {
  return (
    <header className="hidden md:flex items-center justify-end border-b bg-card px-6 py-3">
      <form action={signOut}>
        <Button variant="ghost" size="sm" type="submit">
          <LogOut className="h-4 w-4 mr-1.5" />
          Sign out
        </Button>
      </form>
    </header>
  );
}
