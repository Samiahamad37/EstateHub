import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireRole } from "@/lib/auth";
import { propertyCardInclude } from "@/lib/properties";
import { propertySchema } from "@/lib/validators";
import { notify, notifyMany } from "@/lib/notifications";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const session = await getSession();

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      ...propertyCardInclude,
      viewings: session ? { where: { customerId: session.id }, orderBy: { createdAt: "desc" }, take: 3 } : false,
    },
  });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  const canViewPending =
    session?.role === "ADMIN" || session?.id === property.listedById || session?.id === property.ownerId;
  if (property.verificationStatus !== "APPROVED" && !canViewPending) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.property.update({ where: { id }, data: { viewsCount: { increment: 1 } } }),
    prisma.propertyView.create({ data: { propertyId: id, userId: session?.id } }),
  ]);

  const similar = await prisma.property.findMany({
    where: {
      id: { not: id },
      verificationStatus: "APPROVED",
      OR: [
        { propertyType: property.propertyType },
        { regionName: property.regionName },
        { listingType: property.listingType },
      ],
    },
    include: propertyCardInclude,
    take: 4,
    orderBy: { viewsCount: "desc" },
  });

  const favorited = session
    ? Boolean(await prisma.favorite.findUnique({ where: { userId_propertyId: { userId: session.id, propertyId: id } } }))
    : false;

  return NextResponse.json({ property: { ...property, viewsCount: property.viewsCount + 1 }, similar, favorited });
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.property.findUnique({ where: { id }, include: { favorites: true } });
  if (!existing) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  const isOwner = session.id === existing.listedById || session.id === existing.ownerId;
  if (!isOwner && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (body.verificationStatus && session.role === "ADMIN") {
    const property = await prisma.property.update({
      where: { id },
      data: { verificationStatus: body.verificationStatus },
      include: propertyCardInclude,
    });
    await notify({
      userId: existing.listedById,
      title: body.verificationStatus === "APPROVED" ? "Listing approved" : "Listing rejected",
      body:
        body.verificationStatus === "APPROVED"
          ? `${existing.title} is now live on EstateHub.`
          : `${existing.title} was not approved. Please review and resubmit.`,
      type: "listing",
      link: `/properties/${id}`,
    });
    return NextResponse.json({ property });
  }

  if (body.availabilityStatus && Object.keys(body).length === 1) {
    const property = await prisma.property.update({
      where: { id },
      data: { availabilityStatus: body.availabilityStatus },
      include: propertyCardInclude,
    });
    return NextResponse.json({ property });
  }

  const parsed = propertySchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid update" }, { status: 400 });
  }
  const data = parsed.data;
  const priceDropped = typeof data.price === "number" && data.price < existing.price;

  const property = await prisma.$transaction(async (tx) => {
    if (data.images) {
      await tx.propertyMedia.deleteMany({ where: { propertyId: id, type: "IMAGE" } });
      await tx.propertyMedia.createMany({
        data: data.images.map((url, index) => ({
          propertyId: id,
          url,
          type: "IMAGE",
          sortOrder: index,
          isCover: index === 0,
        })),
      });
    }
    if (data.amenityIds) {
      await tx.propertyAmenity.deleteMany({ where: { propertyId: id } });
      await tx.propertyAmenity.createMany({
        data: data.amenityIds.map((amenityId) => ({ propertyId: id, amenityId })),
      });
    }
    const { images: _images, amenityIds: _amenityIds, ...rest } = data;
    return tx.property.update({
      where: { id },
      data: {
        ...rest,
        videoUrl: rest.videoUrl || null,
        verificationStatus: session.role === "ADMIN" ? existing.verificationStatus : "PENDING",
      },
      include: propertyCardInclude,
    });
  });

  if (priceDropped) {
    await notifyMany(
      existing.favorites.map((f) => f.userId),
      {
        title: "Price reduced on a property you saved",
        body: `${existing.title} is now listed at a lower price.`,
        type: "favorite",
        link: `/properties/${id}`,
      },
    );
  }

  return NextResponse.json({ property });
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const { user, error } = await requireRole(["AGENT", "OWNER", "ADMIN"]);
  if (error || !user) return error!;

  const existing = await prisma.property.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  if (user.role !== "ADMIN" && user.id !== existing.listedById && user.id !== existing.ownerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.property.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
