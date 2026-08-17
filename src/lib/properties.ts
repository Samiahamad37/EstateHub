import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const propertyCardInclude = {
  media: { orderBy: { sortOrder: "asc" as const } },
  amenities: { include: { amenity: true } },
  listedBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatar: true,
      role: true,
      agencyName: true,
    },
  },
  owner: {
    select: { id: true, firstName: true, lastName: true, role: true },
  },
} satisfies Prisma.PropertyInclude;

export type PropertyQuery = {
  q?: string;
  location?: string;
  type?: string;
  listing?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minSize?: number;
  furnished?: string;
  amenities?: string[];
  sort?: string;
  page?: number;
  pageSize?: number;
  lat?: number;
  lng?: number;
  region?: string;
  status?: string;
  listedById?: string;
  includeUnapproved?: boolean;
};

export function buildPropertyWhere(query: PropertyQuery): Prisma.PropertyWhereInput {
  const and: Prisma.PropertyWhereInput[] = [];

  if (!query.includeUnapproved) {
    and.push({ verificationStatus: "APPROVED" });
    and.push({ availabilityStatus: { in: ["AVAILABLE", "PENDING"] } });
  }
  if (query.status) and.push({ verificationStatus: query.status });
  if (query.listedById) and.push({ listedById: query.listedById });
  if (query.type) and.push({ propertyType: query.type });
  if (query.listing) and.push({ listingType: query.listing });
  if (query.furnished) and.push({ furnished: query.furnished });
  if (query.bedrooms) and.push({ bedrooms: { gte: query.bedrooms } });
  if (query.bathrooms) and.push({ bathrooms: { gte: query.bathrooms } });
  if (query.minSize) and.push({ propertySize: { gte: query.minSize } });
  if (query.minPrice || query.maxPrice) {
    and.push({
      price: {
        ...(query.minPrice ? { gte: query.minPrice } : {}),
        ...(query.maxPrice ? { lte: query.maxPrice } : {}),
      },
    });
  }
  if (query.amenities?.length) {
    and.push({
      amenities: { some: { amenity: { name: { in: query.amenities } } } },
    });
  }
  if (query.region) {
    and.push({
      OR: [
        { regionName: { contains: query.region } },
        { districtName: { contains: query.region } },
      ],
    });
  }
  const text = query.q || query.location;
  if (text) {
    and.push({
      OR: [
        { title: { contains: text } },
        { description: { contains: text } },
        { address: { contains: text } },
        { regionName: { contains: text } },
        { districtName: { contains: text } },
        { wardName: { contains: text } },
      ],
    });
  }

  return { AND: and };
}

export function buildPropertyOrder(sort?: string): Prisma.PropertyOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ price: "asc" }];
    case "price_desc":
      return [{ price: "desc" }];
    case "most_viewed":
      return [{ viewsCount: "desc" }];
    case "most_popular":
      return [{ favoritesCount: "desc" }, { viewsCount: "desc" }];
    default:
      return [{ createdAt: "desc" }];
  }
}

export async function listProperties(query: PropertyQuery) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(48, Math.max(6, query.pageSize ?? 12));
  const where = buildPropertyWhere(query);

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: propertyCardInclude,
      orderBy: buildPropertyOrder(query.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.property.count({ where }),
  ]);

  return { items, total, page, pageSize, pages: Math.ceil(total / pageSize) };
}
