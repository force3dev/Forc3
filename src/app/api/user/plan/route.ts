import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { generatePlan } from "@/lib/ai";

export async function POST() {
  try {
    const user = await getCurrentUser();
    const targetUser = user || await prisma.user.findFirst({ include: { profile: true } });
    
    if (!targetUser) {
      return NextResponse.json({ error: "No user found" }, { status: 401 });
    }
    
    const profile = await prisma.profile.findUnique({
      where: { userId: targetUser.id },
    });
    
    if (!profile) {
      return NextResponse.json({ error: "Complete onboarding first" }, { status: 400 });
    }
    
    const { plan, welcomeMessage } = await generatePlan(targetUser.id, profile);
    
    await prisma.user.update({
      where: { id: targetUser.id },
      data: { onboardingDone: true },
    });
    
    return NextResponse.json({ 
      ok: true,
      plan: {
        name: plan.name,
        description: plan.description,
        totalWeeks: plan.totalWeeks,
        splitType: plan.splitType,
      },
      welcomeMessage,
    });
  } catch (error) {
    console.error('Plan generation error:', error);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    const targetUser = user || await prisma.user.findFirst();
    
    if (!targetUser) {
      return NextResponse.json({ error: "No user found" }, { status: 401 });
    }
    
    const plan = await prisma.trainingPlan.findUnique({
      where: { userId: targetUser.id },
      include: {
        weeks: {
          include: {
            sessions: {
              include: {
                exercises: true,
              },
            },
          },
          orderBy: { weekNumber: 'asc' },
        },
      },
    });
    
    if (!plan) {
      return NextResponse.json({ error: "No plan found" }, { status: 404 });
    }
    
    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Plan fetch error:', error);
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 });
  }
}