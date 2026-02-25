import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { dbErrorResponse } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const date = dateStr ? new Date(dateStr) : new Date();

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const [logs, profile] = await Promise.all([
      prisma.nutritionLog.findMany({
        where: {
          userId,
          date: { gte: startOfDay, lte: endOfDay },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.profile.findUnique({ where: { userId } }),
    ]);

    const totals = logs.reduce(
      (acc, log) => ({
        calories: acc.calories + log.calories,
        protein: acc.protein + log.protein,
        carbs: acc.carbs + log.carbs,
        fat: acc.fat + log.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return NextResponse.json({
      logs,
      totals,
      targets: {
        calories: profile?.targetCalories || 2000,
        protein: profile?.targetProtein || 150,
        carbs: profile?.targetCarbs || 200,
        fat: profile?.targetFat || 65,
      },
    });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { calories, protein, carbs, fat, mealName, foodDescription } = await req.json();

    if (!calories || calories <= 0) {
      return NextResponse.json({ error: "Calories required" }, { status: 400 });
    }

    const log = await prisma.nutritionLog.create({
      data: {
        userId,
        calories: parseFloat(calories),
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        mealName: mealName || null,
        foodDescription: foodDescription || null,
      },
    });

    return NextResponse.json({ success: true, id: log.id });
  } catch (err) {
    console.error("Nutrition log error:", err);
    return NextResponse.json({ error: "Failed to log meal" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  try {
    const log = await prisma.nutritionLog.findFirst({ where: { id, userId } });
    if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.nutritionLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
