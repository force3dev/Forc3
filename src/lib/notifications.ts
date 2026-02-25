import { prisma } from "@/lib/prisma";

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: object
) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body, data: data || {}, read: false },
    });
  } catch {
    // Non-critical — never throw
  }
}
