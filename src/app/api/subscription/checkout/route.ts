import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-01-28.clover" })
  : null;

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { priceId, tier } = await req.json();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true, profile: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Get or create Stripe customer
  let customerId = user.subscription?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.profile?.name || undefined,
      metadata: { userId },
    });
    customerId = customer.id;
  }

  const origin = req.headers.get("origin") || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
      metadata: { userId, tier },
    },
    success_url: `${origin}/settings/upgrade?success=true`,
    cancel_url: `${origin}/settings/upgrade?cancelled=true`,
    metadata: { userId, tier },
  });

  return NextResponse.json({ url: session.url });
}
