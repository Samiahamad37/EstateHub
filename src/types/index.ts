export type Role = "CUSTOMER" | "AGENT" | "OWNER" | "ADMIN";

export type PublicUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  bio: string | null;
  role: Role;
  emailVerified: boolean;
  isActive: boolean;
  agencyName: string | null;
  licenseNumber: string | null;
  createdAt: Date | string;
};

export type PropertyMedia = {
  id: string;
  url: string;
  type: string;
  alt?: string | null;
  sortOrder: number;
  isCover: boolean;
};

export type PropertyCard = {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  listingType: string;
  price: number;
  currency: string;
  address: string;
  regionName: string;
  districtName: string;
  wardName: string;
  latitude: number;
  longitude: number;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  propertySize: number;
  landSize: number;
  yearBuilt: number | null;
  furnished: string;
  availabilityStatus: string;
  verificationStatus: string;
  viewsCount: number;
  favoritesCount: number;
  videoUrl?: string | null;
  createdAt: string | Date;
  media: PropertyMedia[];
  amenities?: { amenity: { id: string; name: string } }[];
  listedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string | null;
    avatar?: string | null;
    role: string;
    agencyName?: string | null;
  };
};
