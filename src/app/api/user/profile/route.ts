import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
