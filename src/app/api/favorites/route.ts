import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { propertyCardInclude } from "@/lib/properties";

export async function GET() {
  const { user, error } = await requireUser();
  if (error || !user) return error!;

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: { property: { include: propertyCardInclude } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    items: favorites.map((f) => ({ ...f.property, favoritedAt: f.createdAt })),
  });
}
