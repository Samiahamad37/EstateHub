import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicUserSelect, requireUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validators";

export async function GET() {
  const { user, error } = await requireUser();
  if (error || !user) return error!;
  return NextResponse.json({ user });
}

export async function PATCH(request: NextRequest) {
  const { user, error } = await requireUser();
  if (error || !user) return error!;
  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid profile" }, { status: 400 });
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
    select: publicUserSelect,
  });
  return NextResponse.json({ user: updated });
}
