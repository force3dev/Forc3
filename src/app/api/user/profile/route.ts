import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  const targetUser = user || await prisma.user.findFirst({ include: { profile: true } });
  if (!targetUser) return NextResponse.json({ error: "No user" }, { status: 401 });

  const profile = await prisma.profile.findUnique({ where: { userId: targetUser.id } });
  const plan = await prisma.trainingPlan.findUnique({ where: { userId: targetUser.id } });

  return NextResponse.json({
    user: { id: targetUser.id, email: targetUser.email, name: targetUser.name },
    profile,
    plan: plan ? { name: plan.name, splitType: plan.splitType, totalWeeks: plan.totalWeeks, currentWeek: plan.currentWeek } : null,
  });
}

export async function POST(req: NextRequest) {
  const {
    age, heightCm, weightKg, unitSystem,
    goal, experience, trainingDays, sports,
    eventType, eventDate, injuries, injuryNotes,
  } = await req.json();

  const first = await prisma.user.findFirst();
  if (!first) return NextResponse.json({ error: "No user" }, { status: 401 });

  await prisma.profile.upsert({
    where: { userId: first.id },
    create: {
      userId: first.id,
      age, heightCm, weightKg, unitSystem,
      goal, experience, trainingDays, sports,
      eventType,
      eventDate: eventDate ? new Date(eventDate) : null,
      injuries, injuryNotes,
    },
    update: {
      age, heightCm, weightKg, unitSystem,
      goal, experience, trainingDays, sports,
      eventType,
      eventDate: eventDate ? new Date(eventDate) : null,
      injuries, injuryNotes,
    },
  });

  return NextResponse.json({ ok: true });
}
