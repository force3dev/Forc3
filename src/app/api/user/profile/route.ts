import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { goal, experience, sports, unitSystem } = await req.json();
  const first = await prisma.user.findFirst();
  if (!first) return NextResponse.json({ error: "No user" }, { status: 401 });
  await prisma.profile.upsert({
    where: { userId: first.id },
    create: { userId: first.id, goal, experience, sports, unitSystem },
    update: { goal, experience, sports, unitSystem },
  });
  return NextResponse.json({ ok: true });
}
