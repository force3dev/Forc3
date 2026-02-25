import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createTestAccount() {
  const hashedPassword = await bcrypt.hash("TestAccount123!", 10);

  const user = await prisma.user.upsert({
    where: { email: "test@forc3.app" },
    update: {
      passwordHash: hashedPassword,
      displayName: "Test Athlete",
      username: "testathlete",
    },
    create: {
      email: "test@forc3.app",
      passwordHash: hashedPassword,
      displayName: "Test Athlete",
      username: "testathlete",
    },
  });

  // Ensure premium subscription
  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: { tier: "pro", status: "active" },
    create: { userId: user.id, tier: "pro", status: "active" },
  });

  // Ensure profile
  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      name: "Test Athlete",
      goal: "hybrid",
      experienceLevel: "intermediate",
      trainingDays: 5,
      sessionLength: 60,
      equipment: '["full_gym"]',
      injuries: "[]",
      limitations: "[]",
      onboardingDone: true,
      weight: 80,
      height: 180,
    },
  });

  // Ensure streak record
  await prisma.streak.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      currentStreak: 14,
      longestStreak: 30,
      totalWorkouts: 48,
      totalXP: 5200,
      level: 3,
    },
  });

  console.log("✅ Test account created/updated:");
  console.log("   Email:    test@forc3.app");
  console.log("   Password: TestAccount123!");
  console.log("   Tier:     Premium (unlimited AI coach)");
  console.log("   User ID:", user.id);
}

createTestAccount()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
