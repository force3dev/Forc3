import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  const hashed = await hash(password, 10);
  await prisma.user.create({ data: { email, name, hashedPassword: hashed } });
  return NextResponse.json({ ok: true });
}
