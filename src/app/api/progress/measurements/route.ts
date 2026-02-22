import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const measurements = await (prisma as any).bodyMeasurement.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 60,
  });

  return NextResponse.json({ measurements });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    weight, bodyFat, chest, waist, hips, neck,
    leftArm, rightArm, leftThigh, rightThigh, notes,
  } = body;

  const measurement = await (prisma as any).bodyMeasurement.create({
    data: {
      userId,
      date: new Date(),
      weight: weight ? parseFloat(weight) : null,
      bodyFat: bodyFat ? parseFloat(bodyFat) : null,
      chest: chest ? parseFloat(chest) : null,
      waist: waist ? parseFloat(waist) : null,
      hips: hips ? parseFloat(hips) : null,
      neck: neck ? parseFloat(neck) : null,
      leftArm: leftArm ? parseFloat(leftArm) : null,
      rightArm: rightArm ? parseFloat(rightArm) : null,
      leftThigh: leftThigh ? parseFloat(leftThigh) : null,
      rightThigh: rightThigh ? parseFloat(rightThigh) : null,
      notes: notes || null,
    },
  });

  return NextResponse.json(measurement);
}
