import { prisma } from "@/lib/prisma";

export async function notify(options: {
  userId: string;
  title: string;
  body: string;
  type: string;
  link?: string;
}) {
  return prisma.notification.create({ data: options });
}

export async function notifyMany(
  userIds: string[],
  payload: { title: string; body: string; type: string; link?: string },
) {
  if (!userIds.length) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, ...payload })),
  });
}
