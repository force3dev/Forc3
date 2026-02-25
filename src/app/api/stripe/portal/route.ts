import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub?.stripeCustomerId) return NextResponse.json({ error: "No subscription found" }, { status: 404 });

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" } as any);

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/settings`,
  });

  return NextResponse.json({ url: session.url });
}
