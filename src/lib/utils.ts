import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-SG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** WhatsApp link for admin — uses whatsapp:// protocol for desktop app */
export function formatWhatsAppLink(
  number: string,
  message?: string
): string {
  const encoded = message ? encodeURIComponent(message) : "";
  return `whatsapp://send?phone=65${number}${encoded ? `&text=${encoded}` : ""}`;
}

/** Link to message Eli's Bakery WhatsApp */
export function formatBakeryWhatsAppLink(message?: string): string {
  const encoded = message ? encodeURIComponent(message) : "";
  return `https://api.whatsapp.com/send?phone=6590181742${encoded ? `&text=${encoded}` : ""}`;
}
