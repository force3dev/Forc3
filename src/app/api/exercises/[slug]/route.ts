import { NextRequest, NextResponse } from "next/server";
import { getExerciseBySlug } from "@/lib/exercise-api";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const exercise = await getExerciseBySlug(params.slug);
  if (!exercise) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ exercise });
}
