import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { AI_MODELS } from "@/lib/ai/models";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memories = await prisma.coachMemory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ memories });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages } = await request.json();
  if (!messages?.length) return NextResponse.json({ ok: true });

  const key = process.env.CLAUDE_API_KEY;
  if (!key) return NextResponse.json({ ok: true });

  try {
    const client = new Anthropic({ apiKey: key });
    const convo = messages.slice(-6).map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join("\n");

    const resp = await client.messages.create({
      model: AI_MODELS.FAST,
      max_tokens: 512,
      messages: [{
        role: "user",
        content: `From this conversation, extract important facts to remember about the athlete. Focus on preferences, goals, struggles, achievements, and personal context.\n\nConversation:\n${convo}\n\nReturn JSON array: [{"memory":"string","type":"preference|achievement|struggle|goal|personal"}]\nReturn [] if nothing important to remember.`,
      }],
    });

    const raw = resp.content[0].type === "text" ? resp.content[0].text : "";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return NextResponse.json({ ok: true });

    const memories: { memory: string; type: string }[] = JSON.parse(jsonMatch[0]);
    for (const m of memories.slice(0, 5)) {
      if (m.memory?.trim()) {
        await prisma.coachMemory.create({
          data: { userId, memory: m.memory.slice(0, 500), type: m.type || "personal" },
        });
      }
    }

    // Keep only last 50 memories
    const all = await prisma.coachMemory.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    if (all.length > 50) {
      const toDelete = all.slice(50).map(m => m.id);
      await prisma.coachMemory.deleteMany({ where: { id: { in: toDelete } } });
    }
  } catch { /* non-critical */ }

  return NextResponse.json({ ok: true });
}
