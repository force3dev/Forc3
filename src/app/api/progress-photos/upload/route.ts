import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  // Dynamic import to avoid build-time issues if supabase env not set
  const { uploadProgressPhoto } = await import("@/lib/supabase-storage");
  const photoUrl = await uploadProgressPhoto(userId, file);
  return NextResponse.json({ photoUrl });
}
