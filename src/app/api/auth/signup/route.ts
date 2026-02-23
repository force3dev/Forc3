import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, sessionCookieOptions } from "@/lib/auth";
import { TRIAL_DAYS } from "@/lib/subscription/tiers";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email-templates";

function generateReferralCode(email: string): string {
  const prefix = email.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
  const suffix = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `${prefix}${suffix}`
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, referralCode } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (!/\d/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least 1 number" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);
    const myReferralCode = generateReferralCode(email)

    // Validate referral code if provided
    let referrerId: string | undefined
    let trialDays = TRIAL_DAYS
    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode } })
      if (referrer) {
        referrerId = referrer.id
        trialDays = 14 // Extended trial for referred users
      }
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        referralCode: myReferralCode,
        referredBy: referralCode || null,
        profile: {
          create: { onboardingDone: false },
        },
        subscription: {
          create: {
            tier: "free",
            status: "active",
            trialEnd: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000),
          },
        },
        streak: {
          create: { currentStreak: 0, longestStreak: 0 },
        },
      },
    });

    // Create referral record
    if (referrerId) {
      await prisma.referral.create({
        data: {
          referrerId,
          referredId: user.id,
          referralCode: referralCode!,
          status: 'signed_up',
        },
      }).catch(() => {}) // Non-blocking
    }

    // Send welcome email (non-blocking)
    const { subject, html } = welcomeEmail(email.split('@')[0])
    sendEmail({ to: email, subject, html }).catch(() => {})

    const token = await createSession({
      userId: user.id,
      email: user.email,
      onboardingDone: false,
    });

    const res = NextResponse.json({ success: true });
    res.cookies.set(sessionCookieOptions(token));
    return res;
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
