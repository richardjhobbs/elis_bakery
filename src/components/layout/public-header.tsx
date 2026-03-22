import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function PublicHeader() {
  return (
    <header className="relative text-center py-6 px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <h1 className="font-display text-4xl text-brown-700 dark:text-primary">
        Eli&apos;s Artisan Bakery
      </h1>
      <div className="flex justify-center my-3">
        <Image
          src="/logo.jpg"
          alt="Eli's Artisan Bakery logo"
          width={80}
          height={80}
          className="rounded-full"
        />
      </div>
      <p className="text-muted-foreground mt-1">
        Fresh bakes made with love
      </p>
    </header>
  );
}
