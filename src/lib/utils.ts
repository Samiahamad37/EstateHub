import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency = "TZS") {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatCompactPrice(price: number, currency = "TZS") {
  if (price >= 1_000_000_000) {
    return `${currency} ${(price / 1_000_000_000).toFixed(1)}B`;
  }
  if (price >= 1_000_000) {
    return `${currency} ${(price / 1_000_000).toFixed(price >= 10_000_000 ? 0 : 1)}M`;
  }
  if (price >= 1_000) {
    return `${currency} ${(price / 1_000).toFixed(0)}K`;
  }
  return formatPrice(price, currency);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function fullName(user: { firstName: string; lastName: string }) {
  return `${user.firstName} ${user.lastName}`.trim();
}

export function listingLabel(type: string) {
  return type.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function propertyTypeLabel(type: string) {
  return listingLabel(type);
}

export function getCoverImage(media?: { url: string; isCover?: boolean; type?: string }[]) {
  if (!media?.length) return "/placeholder-property.svg";
  const images = media.filter((m) => !m.type || m.type === "IMAGE");
  return images.find((m) => m.isCover)?.url ?? images[0]?.url ?? "/placeholder-property.svg";
}

export function jsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
