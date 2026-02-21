import { getSession } from "./auth";
import { prisma } from "./prisma";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      profile: true,
      subscription: true,
      streak: true,
    },
  });

  return user;
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.userId ?? null;
}

export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }
  return userId;
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const session = await getSession();
  return session?.onboardingDone ?? false;
}
