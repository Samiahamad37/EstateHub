export const ROLES = ["CUSTOMER", "AGENT", "OWNER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const PROPERTY_TYPES = [
  "HOUSE",
  "APARTMENT",
  "VILLA",
  "LAND",
  "OFFICE",
  "SHOP",
  "WAREHOUSE",
  "COMMERCIAL_BUILDING",
  "HOTEL",
  "FARM",
  "OTHER",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const LISTING_TYPES = [
  "FOR_SALE",
  "FOR_RENT",
  "SHORT_TERM_RENTAL",
  "LEASE",
] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const FURNISHED_STATUSES = [
  "FURNISHED",
  "SEMI_FURNISHED",
  "UNFURNISHED",
] as const;

export const AVAILABILITY_STATUSES = [
  "AVAILABLE",
  "PENDING",
  "SOLD",
  "RENTED",
  "UNAVAILABLE",
] as const;

export const VERIFICATION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export const VIEWING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
] as const;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "most_viewed", label: "Most viewed" },
  { value: "most_popular", label: "Most popular" },
] as const;

export const AMENITY_CATALOG = [
  { name: "Swimming Pool", icon: "waves" },
  { name: "Garden", icon: "trees" },
  { name: "Security", icon: "shield" },
  { name: "Generator", icon: "zap" },
  { name: "Air Conditioning", icon: "wind" },
  { name: "Internet", icon: "wifi" },
  { name: "Gym", icon: "dumbbell" },
  { name: "Parking", icon: "car" },
  { name: "Elevator", icon: "arrow-up-down" },
  { name: "Balcony", icon: "layout" },
  { name: "Servant Quarter", icon: "home" },
  { name: "Water Tank", icon: "droplets" },
  { name: "CCTV", icon: "cctv" },
  { name: "Backup Power", icon: "battery" },
  { name: "Sea View", icon: "sailboat" },
  { name: "Furnished Kitchen", icon: "utensils" },
  { name: "Fireplace", icon: "flame" },
  { name: "Pet Friendly", icon: "paw-print" },
] as const;

export const CURRENCIES = ["TZS", "USD", "EUR", "KES"] as const;

export const DEMO_ACCOUNTS = [
  { role: "Administrator", email: "admin@estatehub.com", password: "EstateHub@2026" },
  { role: "Agent", email: "agent@estatehub.com", password: "EstateHub@2026" },
  { role: "Property Owner", email: "owner@estatehub.com", password: "EstateHub@2026" },
  { role: "Customer", email: "customer@estatehub.com", password: "EstateHub@2026" },
] as const;
