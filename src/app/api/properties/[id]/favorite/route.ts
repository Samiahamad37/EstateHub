import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const { user, error } = await requireUser();
  if (error || !user) return error!;

  const existing = await prisma.favorite.findUnique({
    where: { userId_propertyId: { userId: user.id, propertyId: id } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.favorite.delete({ where: { id: existing.id } }),
      prisma.property.update({ where: { id }, data: { favoritesCount: { decrement: 1 } } }),
    ]);
    return NextResponse.json({ favorited: false });
  }

  await prisma.$transaction([
    prisma.favorite.create({ data: { userId: user.id, propertyId: id } }),
    prisma.property.update({ where: { id }, data: { favoritesCount: { increment: 1 } } }),
  ]);
  return NextResponse.json({ favorited: true });
}
