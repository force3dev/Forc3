import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  try {
    const res = NextResponse.json({ success: true });
    res.cookies.set(clearSessionCookie());
    return res;
  } catch (error: any) {
    console.error("POST /api/auth/logout error:", error?.message);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
