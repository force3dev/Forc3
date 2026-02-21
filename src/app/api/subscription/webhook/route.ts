import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-01-28.clover" })
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  const body = await req.text();
  const sig = req.headers.get("stripe-signature") || "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const handleSubscription = async (sub: Stripe.Subscription) => {
    const userId = sub.metadata?.userId;
    const tier = (sub.metadata?.tier || "pro") as string;
    if (!userId) return;

    const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : null;

    // Period dates are on the first subscription item in newer Stripe SDK versions
    const item = sub.items?.data?.[0];
    const periodStart = (item as unknown as { current_period_start?: number })?.current_period_start;
    const periodEnd = (item as unknown as { current_period_end?: number })?.current_period_end;

    const currentPeriodStart = periodStart ? new Date(periodStart * 1000) : new Date();
    const currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000) : new Date();

    await prisma.subscription.upsert({
      where: { userId },
      update: {
        tier,
        status: sub.status === "active" || sub.status === "trialing" ? "active" : sub.status,
        stripeSubscriptionId: sub.id,
        stripeCustomerId: sub.customer as string,
        currentPeriodStart,
        currentPeriodEnd,
        trialEnd,
      },
      create: {
        userId,
        tier,
        status: "active",
        stripeSubscriptionId: sub.id,
        stripeCustomerId: sub.customer as string,
        currentPeriodStart,
        currentPeriodEnd,
        trialEnd,
      },
    });
  };

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscription(event.data.object as Stripe.Subscription);
      break;

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (userId) {
        await prisma.subscription.update({
          where: { userId },
          data: { tier: "free", status: "cancelled" },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string };
      if (invoice.subscription) {
        const sub = await stripe.subscriptions.retrieve(invoice.subscription);
        const userId = sub.metadata?.userId;
        if (userId) {
          await prisma.subscription.update({
            where: { userId },
            data: { status: "past_due" },
          });
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
