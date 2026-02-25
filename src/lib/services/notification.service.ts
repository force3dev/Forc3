import { prisma } from '@/lib/prisma'

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: any
) {
  try {
    return await prisma.notification.create({
      data: { userId, type, title, body, data: data || {} }
    })
  } catch {
    return null
  }
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } })
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } })
}
