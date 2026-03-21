import Link from "next/link";

export function InstagramLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="https://www.instagram.com/elisartisanbakery"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center text-primary hover:text-primary/80 transition-colors ${className}`}
      aria-label="Follow Eli's Artisan Bakery on Instagram"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    </Link>
  );
}
