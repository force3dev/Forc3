import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await prisma.user.findFirst();
  const items = user ? await prisma.mealLog.findMany({ where: { userId: user.id }, orderBy: { date: "desc" }, take: 20 }) : [];
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 401 });
  const { calories, proteinG, carbsG, fatG } = await req.json();
  const created = await prisma.mealLog.create({ data: { userId: user.id, calories, proteinG, carbsG, fatG } });
  return NextResponse.json({ ok: true, id: created.id });
}
