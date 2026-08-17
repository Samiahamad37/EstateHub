import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const { user, error } = await requireUser();
  if (error || !user) return error!;

  if (user.role === "ADMIN") {
    const [users, properties, pending, agents, viewings, messages] = await Promise.all([
      prisma.user.count(),
      prisma.property.count(),
      prisma.property.count({ where: { verificationStatus: "PENDING" } }),
      prisma.user.count({ where: { role: "AGENT" } }),
      prisma.viewingRequest.count(),
      prisma.message.count(),
    ]);
    const byType = await prisma.property.groupBy({ by: ["propertyType"], _count: true });
    const byListing = await prisma.property.groupBy({ by: ["listingType"], _count: true });
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true },
    });
    const monthly = await monthlyCounts();
    return NextResponse.json({
      role: user.role,
      stats: {
        users,
        properties,
        pending,
        agents,
        viewings,
        messages,
        activeListings: await prisma.property.count({
          where: { verificationStatus: "APPROVED", availabilityStatus: "AVAILABLE" },
        }),
      },
      byType,
      byListing,
      recentUsers,
      monthly,
    });
  }

  if (user.role === "CUSTOMER") {
    const [favorites, viewings, searches, notifications] = await Promise.all([
      prisma.favorite.count({ where: { userId: user.id } }),
      prisma.viewingRequest.findMany({
        where: { customerId: user.id },
        include: { property: { include: { media: { take: 1 } } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.searchHistory.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 8 }),
      prisma.notification.count({ where: { userId: user.id, read: false } }),
    ]);
    return NextResponse.json({
      role: user.role,
      stats: { favorites, viewings: viewings.length, searches: searches.length, unread: notifications },
      viewings,
      searches,
    });
  }

  const propertyWhere =
    user.role === "OWNER"
      ? { OR: [{ listedById: user.id }, { ownerId: user.id }] }
      : { listedById: user.id };

  const properties = await prisma.property.findMany({
    where: propertyWhere,
    include: { media: { take: 1 } },
    orderBy: { createdAt: "desc" },
  });
  const ids = properties.map((p) => p.id);
  const [inquiries, viewings, favorites] = await Promise.all([
    prisma.conversation.count({ where: { propertyId: { in: ids } } }),
    prisma.viewingRequest.findMany({
      where: { propertyId: { in: ids } },
      include: {
        property: true,
        customer: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.favorite.count({ where: { propertyId: { in: ids } } }),
  ]);

  const viewsSeries = properties.map((p) => ({ name: p.title.slice(0, 18), views: p.viewsCount, favorites: p.favoritesCount }));

  return NextResponse.json({
    role: user.role,
    stats: {
      totalProperties: properties.length,
      activeListings: properties.filter((p) => p.verificationStatus === "APPROVED" && p.availabilityStatus === "AVAILABLE").length,
      totalViews: properties.reduce((s, p) => s + p.viewsCount, 0),
      favorites,
      inquiries,
      viewingRequests: viewings.length,
    },
    properties,
    viewings,
    viewsSeries,
  });
}

async function monthlyCounts() {
  const since = new Date();
  since.setMonth(since.getMonth() - 5);
  const properties = await prisma.property.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });
  const users = await prisma.user.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    return { key, label: d.toLocaleString("en", { month: "short" }), properties: 0, users: 0 };
  });
  const map = new Map(months.map((m) => [m.key, m]));
  for (const p of properties) {
    const key = `${p.createdAt.getFullYear()}-${p.createdAt.getMonth()}`;
    const row = map.get(key);
    if (row) row.properties += 1;
  }
  for (const u of users) {
    const key = `${u.createdAt.getFullYear()}-${u.createdAt.getMonth()}`;
    const row = map.get(key);
    if (row) row.users += 1;
  }
  return months;
}
