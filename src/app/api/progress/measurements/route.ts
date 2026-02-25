import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const raw = await prisma.bodyMeasurement.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 60,
    });

    // Normalize schema names (bicepLeft → leftArm) for frontend compatibility
    const measurements = raw.map(m => ({
      ...m,
      leftArm: m.bicepLeft,
      rightArm: m.bicepRight,
      leftThigh: m.thighLeft,
      rightThigh: m.thighRight,
    }));

    return NextResponse.json({ measurements });
  } catch (error: any) {
    console.error("GET /api/progress/measurements error:", error?.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      weight, bodyFat, chest, waist, hips, neck,
      leftArm, rightArm, leftThigh, rightThigh, notes,
    } = body;

    const measurement = await prisma.bodyMeasurement.create({
      data: {
        userId,
        date: new Date(),
        weight: weight ? parseFloat(weight) : null,
        bodyFat: bodyFat ? parseFloat(bodyFat) : null,
        chest: chest ? parseFloat(chest) : null,
        waist: waist ? parseFloat(waist) : null,
        hips: hips ? parseFloat(hips) : null,
        neck: neck ? parseFloat(neck) : null,
        // schema uses bicepLeft/bicepRight, form sends leftArm/rightArm
        bicepLeft: leftArm ? parseFloat(leftArm) : null,
        bicepRight: rightArm ? parseFloat(rightArm) : null,
        thighLeft: leftThigh ? parseFloat(leftThigh) : null,
        thighRight: rightThigh ? parseFloat(rightThigh) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json(measurement);
  } catch (error: any) {
    console.error("POST /api/progress/measurements error:", error?.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
