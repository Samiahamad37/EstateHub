import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { conversationSchema } from "@/lib/validators";
import { notify } from "@/lib/notifications";

export async function GET() {
  const { user, error } = await requireUser();
  if (error || !user) return error!;

  const items = await prisma.conversation.findMany({
    where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
    include: {
      userA: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
      userB: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
      property: { select: { id: true, title: true, media: { take: 1 } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  const withUnread = await Promise.all(
    items.map(async (c) => {
      const unread = await prisma.message.count({
        where: { conversationId: c.id, senderId: { not: user.id }, readAt: null },
      });
      return { ...c, unread };
    }),
  );

  return NextResponse.json({ items: withUnread });
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireUser();
  if (error || !user) return error!;

  const parsed = conversationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid message" }, { status: 400 });
  }
  if (parsed.data.recipientId === user.id) {
    return NextResponse.json({ error: "You cannot message yourself" }, { status: 400 });
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      OR: [
        { userAId: user.id, userBId: parsed.data.recipientId, propertyId: parsed.data.propertyId ?? null },
        { userAId: parsed.data.recipientId, userBId: user.id, propertyId: parsed.data.propertyId ?? null },
      ],
    },
  });

  const conversation =
    existing ??
    (await prisma.conversation.create({
      data: {
        userAId: user.id,
        userBId: parsed.data.recipientId,
        propertyId: parsed.data.propertyId,
      },
    }));

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: user.id,
      body: parsed.data.body,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessage: parsed.data.body, lastMessageAt: new Date() },
  });

  await notify({
    userId: parsed.data.recipientId,
    title: "New message",
    body: `${user.firstName}: ${parsed.data.body.slice(0, 80)}`,
    type: "message",
    link: `/messages?c=${conversation.id}`,
  });

  return NextResponse.json({ conversationId: conversation.id, message }, { status: existing ? 200 : 201 });
}
