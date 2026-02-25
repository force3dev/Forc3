import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const meals = await prisma.savedMeal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ meals });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action } = body;

  if (action === "delete") {
    await prisma.savedMeal.delete({ where: { id: body.id } });
    return NextResponse.json({ ok: true });
  }

  // Create saved meal
  const { name, items, calories, protein, carbs, fat } = body;
  if (!name || !items) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const meal = await prisma.savedMeal.create({
    data: {
      userId,
      name,
      items: items as object[],
      calories: Math.round(calories || 0),
      protein: protein || 0,
      carbs: carbs || 0,
      fat: fat || 0,
    },
  });

  return NextResponse.json({ meal });
}
