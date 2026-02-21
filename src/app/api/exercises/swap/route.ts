import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { findSwapOptions } from "@/lib/ai/exerciseSwap";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const exerciseId = searchParams.get("exerciseId");
  if (!exerciseId) return NextResponse.json({ error: "exerciseId required" }, { status: 400 });

  const profile = await prisma.profile.findUnique({ where: { userId } });
  const equipment = profile?.equipment || "full_gym";
  const injuries: string[] = JSON.parse(profile?.injuries || "[]");

  const options = await findSwapOptions(exerciseId, equipment, injuries);
  return NextResponse.json({ options });
}
