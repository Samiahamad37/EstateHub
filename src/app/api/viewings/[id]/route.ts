import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { viewingStatusSchema } from "@/lib/validators";
import { notify } from "@/lib/notifications";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const { user, error } = await requireUser();
  if (error || !user) return error!;

  const parsed = viewingStatusSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const viewing = await prisma.viewingRequest.findUnique({
    where: { id },
    include: { property: true, customer: true },
  });
  if (!viewing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canManage =
    user.role === "ADMIN" ||
    user.id === viewing.agentId ||
    user.id === viewing.property.listedById ||
    user.id === viewing.property.ownerId;
  const canCancel = user.id === viewing.customerId && parsed.data.status === "CANCELLED";

  if (!canManage && !canCancel) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.viewingRequest.update({
    where: { id },
    data: { status: parsed.data.status },
    include: {
      property: true,
      customer: { select: { id: true, firstName: true, lastName: true } },
      agent: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  const statusText = parsed.data.status.toLowerCase();
  await notify({
    userId: viewing.customerId,
    title: `Viewing ${statusText}`,
    body: `Your appointment for ${viewing.property.title} is now ${statusText}.`,
    type: "viewing",
    link: "/dashboard/viewings",
  });
  if (user.id !== viewing.agentId) {
    await notify({
      userId: viewing.agentId,
      title: `Viewing ${statusText}`,
      body: `${viewing.property.title} viewing is now ${statusText}.`,
      type: "viewing",
      link: "/dashboard/viewings",
    });
  }

  return NextResponse.json({ viewing: updated });
}
