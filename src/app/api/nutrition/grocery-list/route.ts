import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const plan = await prisma.mealPlan.findFirst({
    where: { userId, weekStart: { gte: monday } },
    orderBy: { generatedAt: "desc" },
    select: { groceryList: true, weekStart: true },
  });

  if (!plan) return NextResponse.json({ groceryList: null });
  return NextResponse.json({ groceryList: plan.groceryList, weekStart: plan.weekStart });
}
