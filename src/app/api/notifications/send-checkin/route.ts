import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push-notifications";

export async function POST(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    include: { user: { include: { profile: true } } },
  });

  let sent = 0;
  let failed = 0;
  for (const sub of subscriptions) {
    const name = sub.user.profile?.name?.split(" ")[0] ?? "Athlete";
    try {
      await sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        { title: `Good morning, ${name}! 🏋️`, body: "Your daily coaching brief is ready.", url: "/dashboard" }
      );
      sent++;
    } catch {
      failed++;
      // Remove stale subscriptions
      await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
    }
  }
  return NextResponse.json({ sent, failed });
}
