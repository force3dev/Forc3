import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const favorites = await (prisma as any).favoriteMeal.findMany({
    where: { userId },
    orderBy: [{ timesUsed: "desc" }, { createdAt: "desc" }],
    take: 20,
  });

  return NextResponse.json({ favorites });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, calories, protein, carbs, fat, items } = await req.json();

  const fav = await (prisma as any).favoriteMeal.create({
    data: {
      userId,
      name: name || "Saved Meal",
      calories: calories || 0,
      protein: protein || 0,
      carbs: carbs || 0,
      fat: fat || 0,
      items: items ? JSON.stringify(items) : null,
    },
  });

  return NextResponse.json(fav);
}

export async function DELETE(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await (prisma as any).favoriteMeal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
