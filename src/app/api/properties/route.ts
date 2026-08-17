import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireRole } from "@/lib/auth";
import { listProperties, propertyCardInclude } from "@/lib/properties";
import { propertySchema } from "@/lib/validators";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/notifications";

function num(value: string | null) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const session = await getSession();
  const listedById = sp.get("mine") === "1" && session ? session.id : undefined;

  const result = await listProperties({
    q: sp.get("q") ?? undefined,
    location: sp.get("location") ?? undefined,
    type: sp.get("type") ?? undefined,
    listing: sp.get("listing") ?? undefined,
    minPrice: num(sp.get("minPrice")),
    maxPrice: num(sp.get("maxPrice")),
    bedrooms: num(sp.get("bedrooms")),
    bathrooms: num(sp.get("bathrooms")),
    minSize: num(sp.get("minSize")),
    furnished: sp.get("furnished") ?? undefined,
    amenities: sp.get("amenities")?.split(",").filter(Boolean),
    sort: sp.get("sort") ?? undefined,
    page: num(sp.get("page")),
    pageSize: num(sp.get("pageSize")),
    region: sp.get("region") ?? undefined,
    status: sp.get("status") ?? undefined,
    listedById,
    includeUnapproved: Boolean(listedById) || session?.role === "ADMIN",
  });

  if (session && (sp.get("q") || sp.get("location") || sp.get("type"))) {
    await prisma.searchHistory.create({
      data: {
        userId: session.id,
        query: sp.get("q") || sp.get("location") || "",
        filters: JSON.stringify(Object.fromEntries(sp.entries())),
      },
    });
  }

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireRole(["AGENT", "OWNER", "ADMIN"]);
  if (error || !user) return error!;

  const blocked = rateLimit(clientKey(request, "create-property"), 20, 60_000);
  if (!blocked.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const parsed = propertySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid listing" }, { status: 400 });
  }

  const data = parsed.data;
  const property = await prisma.property.create({
    data: {
      title: data.title,
      description: data.description,
      propertyType: data.propertyType,
      listingType: data.listingType,
      price: data.price,
      currency: data.currency,
      address: data.address,
      regionName: data.regionName,
      districtName: data.districtName,
      wardName: data.wardName,
      regionId: data.regionId,
      districtId: data.districtId,
      wardId: data.wardId,
      latitude: data.latitude,
      longitude: data.longitude,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      parkingSpaces: data.parkingSpaces,
      propertySize: data.propertySize,
      landSize: data.landSize,
      yearBuilt: data.yearBuilt,
      furnished: data.furnished,
      availabilityStatus: data.availabilityStatus,
      videoUrl: data.videoUrl || null,
      listedById: user.id,
      ownerId: user.role === "OWNER" ? user.id : data.ownerId,
      categoryId: data.categoryId,
      verificationStatus: user.role === "ADMIN" ? "APPROVED" : "PENDING",
      media: {
        create: data.images.map((url, index) => ({
          url,
          type: "IMAGE",
          sortOrder: index,
          isCover: index === 0,
        })),
      },
      amenities: {
        create: data.amenityIds.map((amenityId) => ({ amenityId })),
      },
    },
    include: propertyCardInclude,
  });

  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  await Promise.all(
    admins.map((admin) =>
      notify({
        userId: admin.id,
        title: "Listing awaiting approval",
        body: `${property.title} was submitted by ${user.firstName} ${user.lastName}.`,
        type: "listing",
        link: `/dashboard/admin/properties`,
      }),
    ),
  );

  return NextResponse.json({ property }, { status: 201 });
}
