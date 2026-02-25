import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" } as any);

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const session = event.data.object as { metadata?: { userId?: string }; customer?: string; id?: string };
  const userId = session.metadata?.userId;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        if (userId) {
          await prisma.subscription.upsert({
            where: { userId },
            update: {
              tier: "pro",
              status: "active",
              stripeCustomerId: (session.customer as string) || undefined,
            },
            create: {
              userId,
              tier: "pro",
              status: "active",
              stripeCustomerId: (session.customer as string) || undefined,
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        if (session.customer) {
          const sub = await prisma.subscription.findFirst({
            where: { stripeCustomerId: session.customer as string },
          });
          if (sub) {
            const subObj = event.data.object as any;
            const isActive = subObj.status === "active" || subObj.status === "trialing";
            await prisma.subscription.update({
              where: { id: sub.id },
              data: {
                tier: isActive ? "pro" : "free",
                status: isActive ? "active" : subObj.status,
                currentPeriodStart: subObj.current_period_start
                  ? new Date(subObj.current_period_start * 1000)
                  : undefined,
                currentPeriodEnd: subObj.current_period_end
                  ? new Date(subObj.current_period_end * 1000)
                  : undefined,
              },
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        if (session.customer) {
          const sub = await prisma.subscription.findFirst({
            where: { stripeCustomerId: session.customer as string },
          });
          if (sub) {
            await prisma.subscription.update({
              where: { id: sub.id },
              data: { tier: "free", status: "canceled" },
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        if (session.customer) {
          const sub = await prisma.subscription.findFirst({
            where: { stripeCustomerId: session.customer as string },
          });
          if (sub) {
            await prisma.subscription.update({
              where: { id: sub.id },
              data: { status: "past_due" },
            });
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        if (session.customer) {
          const sub = await prisma.subscription.findFirst({
            where: { stripeCustomerId: session.customer as string },
          });
          if (sub) {
            await prisma.subscription.update({
              where: { id: sub.id },
              data: { tier: "pro", status: "active" },
            });
          }
        }
        break;
      }
    }
  } catch (err: any) {
    console.error("[Stripe Webhook] Error processing event:", err?.message);
  }

  return NextResponse.json({ received: true });
}
