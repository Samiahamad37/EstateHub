import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { user, error } = await requireUser();
  if (error || !user) return error!;
  const body = await request.json();
  const report = await prisma.report.create({
    data: {
      reporterId: user.id,
      propertyId: body.propertyId,
      reason: body.reason ?? "Other",
      details: body.details,
    },
  });
  return NextResponse.json({ report }, { status: 201 });
}
