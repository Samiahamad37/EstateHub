import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { viewingSchema } from "@/lib/validators";
import { notify } from "@/lib/notifications";

export async function GET() {
  const { user, error } = await requireUser();
  if (error || !user) return error!;

  const where =
    user.role === "ADMIN"
      ? {}
      : user.role === "CUSTOMER"
        ? { customerId: user.id }
        : { OR: [{ agentId: user.id }, { property: { listedById: user.id } }, { property: { ownerId: user.id } }] };

  const items = await prisma.viewingRequest.findMany({
    where,
    include: {
      property: { include: { media: true } },
      customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      agent: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireUser();
  if (error || !user) return error!;
  if (user.role !== "CUSTOMER" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only customers can request viewings" }, { status: 403 });
  }

  const parsed = viewingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId } });
  if (!property || property.verificationStatus !== "APPROVED") {
    return NextResponse.json({ error: "Property not available" }, { status: 404 });
  }

  const viewing = await prisma.viewingRequest.create({
    data: {
      propertyId: property.id,
      customerId: user.id,
      agentId: property.listedById,
      date: parsed.data.date,
      time: parsed.data.time,
      message: parsed.data.message,
    },
    include: { property: true },
  });

  await notify({
    userId: property.listedById,
    title: "New viewing request",
    body: `${user.firstName} ${user.lastName} requested a visit to ${property.title} on ${viewing.date} at ${viewing.time}.`,
    type: "viewing",
    link: "/dashboard/viewings",
  });
  if (property.ownerId && property.ownerId !== property.listedById) {
    await notify({
      userId: property.ownerId,
      title: "Viewing request received",
      body: `A customer requested to view ${property.title}. Approve or reject it from your dashboard.`,
      type: "viewing",
      link: "/dashboard/viewings",
    });
  }

  return NextResponse.json({ viewing }, { status: 201 });
}
