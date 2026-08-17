import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { messageSchema } from "@/lib/validators";
import { notify } from "@/lib/notifications";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const { user, error } = await requireUser();
  if (error || !user) return error!;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      userA: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
      userB: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
      property: { select: { id: true, title: true } },
      messages: {
        include: { sender: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!conversation || (conversation.userAId !== user.id && conversation.userBId !== user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.message.updateMany({
    where: { conversationId: id, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ conversation });
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const { user, error } = await requireUser();
  if (error || !user) return error!;

  const parsed = messageSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });

  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation || (conversation.userAId !== user.id && conversation.userBId !== user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const message = await prisma.message.create({
    data: { conversationId: id, senderId: user.id, body: parsed.data.body },
    include: { sender: { select: { id: true, firstName: true, lastName: true } } },
  });

  await prisma.conversation.update({
    where: { id },
    data: { lastMessage: parsed.data.body, lastMessageAt: new Date() },
  });

  const recipientId = conversation.userAId === user.id ? conversation.userBId : conversation.userAId;
  await notify({
    userId: recipientId,
    title: "New message",
    body: `${user.firstName}: ${parsed.data.body.slice(0, 80)}`,
    type: "message",
    link: `/messages?c=${id}`,
  });

  return NextResponse.json({ message }, { status: 201 });
}
