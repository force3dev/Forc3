import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const photos = await prisma.progressPhoto.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ photos });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { imageUrl, weight, notes, date, type } = await req.json();
  const photo = await prisma.progressPhoto.create({
    data: { userId, imageUrl, photoUrl: imageUrl, weight, notes, date: date ? new Date(date) : new Date(), type: type ?? "front" },
  });
  return NextResponse.json({ photo });
}
