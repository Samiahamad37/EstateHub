import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { slugify } from "@/lib/utils";

type Ctx = { params: Promise<{ resource: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  const { user, error } = await requireRole(["ADMIN"]);
  if (error || !user) return error!;
  const { resource } = await ctx.params;
  const q = request.nextUrl.searchParams.get("q") ?? "";

  if (resource === "users") {
    const items = await prisma.user.findMany({
      where: q
        ? {
            OR: [
              { email: { contains: q } },
              { firstName: { contains: q } },
              { lastName: { contains: q } },
            ],
          }
        : undefined,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        phone: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items });
  }

  if (resource === "reports") {
    const items = await prisma.report.findMany({
      include: {
        reporter: { select: { firstName: true, lastName: true, email: true } },
        property: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items });
  }

  if (resource === "categories") {
    return NextResponse.json({ items: await prisma.category.findMany({ orderBy: { name: "asc" } }) });
  }

  if (resource === "locations") {
    const regions = await prisma.region.findMany({
      include: { districts: { include: { wards: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ items: regions });
  }

  if (resource === "settings") {
    const items = await prisma.setting.findMany();
    return NextResponse.json({
      items: Object.fromEntries(items.map((s) => [s.key, s.value])),
    });
  }

  return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { user, error } = await requireRole(["ADMIN"]);
  if (error || !user) return error!;
  const { resource } = await ctx.params;
  const body = await request.json();

  if (resource === "users") {
    const updated = await prisma.user.update({
      where: { id: body.id },
      data: {
        ...(body.role ? { role: body.role } : {}),
        ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
      },
      select: { id: true, role: true, isActive: true },
    });
    return NextResponse.json({ user: updated });
  }

  if (resource === "reports") {
    const updated = await prisma.report.update({
      where: { id: body.id },
      data: { status: body.status, assigneeId: user.id },
    });
    return NextResponse.json({ report: updated });
  }

  if (resource === "settings") {
    const entries = Object.entries(body as Record<string, string>);
    await Promise.all(
      entries.map(([key, value]) =>
        prisma.setting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } }),
      ),
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const { user, error } = await requireRole(["ADMIN"]);
  if (error || !user) return error!;
  const { resource } = await ctx.params;
  const body = await request.json();

  if (resource === "categories") {
    const item = await prisma.category.create({
      data: { name: body.name, slug: slugify(body.name), description: body.description },
    });
    return NextResponse.json({ item }, { status: 201 });
  }

  if (resource === "locations") {
    if (body.type === "region") {
      const item = await prisma.region.create({ data: { name: body.name } });
      return NextResponse.json({ item }, { status: 201 });
    }
    if (body.type === "district") {
      const item = await prisma.district.create({ data: { name: body.name, regionId: body.regionId } });
      return NextResponse.json({ item }, { status: 201 });
    }
    if (body.type === "ward") {
      const item = await prisma.ward.create({ data: { name: body.name, districtId: body.districtId } });
      return NextResponse.json({ item }, { status: 201 });
    }
  }

  return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const { user, error } = await requireRole(["ADMIN"]);
  if (error || !user) return error!;
  const { resource } = await ctx.params;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (resource === "categories") {
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
}
