import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { analyzePersonality } from "@/lib/ai/personality";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const personality = await prisma.coachPersonality.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  return NextResponse.json(personality);
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  // If explicit update
  if (body.tonePreference) {
    const updated = await prisma.coachPersonality.upsert({
      where: { userId },
      create: { userId, tonePreference: body.tonePreference },
      update: { tonePreference: body.tonePreference },
    });
    return NextResponse.json(updated);
  }

  // Otherwise trigger background analysis
  analyzePersonality(userId).catch(console.error);
  return NextResponse.json({ ok: true, message: "Analysis triggered" });
}
