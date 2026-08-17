import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [amenities, regions, categories] = await Promise.all([
    prisma.amenity.findMany({ orderBy: { name: "asc" } }),
    prisma.region.findMany({
      include: { districts: { include: { wards: true }, orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  return NextResponse.json({ amenities, regions, categories });
}
