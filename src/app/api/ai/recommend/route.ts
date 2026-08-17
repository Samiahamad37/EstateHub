import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { recommendForUser } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { propertyCardInclude } from "@/lib/properties";

export async function GET() {
  const { user, error } = await requireUser();
  if (error || !user) return error!;

  const result = await recommendForUser(user.id, 6);
  if (!result.properties.length) {
    const fallback = await prisma.property.findMany({
      where: { verificationStatus: "APPROVED", availabilityStatus: "AVAILABLE" },
      include: propertyCardInclude,
      orderBy: { viewsCount: "desc" },
      take: 6,
    });
    return NextResponse.json({
      ...result,
      properties: fallback,
      explanation: "Popular verified listings across Tanzania to get you started.",
    });
  }
  return NextResponse.json(result);
}
