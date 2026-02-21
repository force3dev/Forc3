import { auth } from "./auth";
import { prisma } from "./prisma";

/**
 * Get the current authenticated user from the session.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: true,
      trainingPlan: true,
      nutritionPlan: true,
    },
  });
  
  return user;
}

/**
 * Get just the user ID from session (faster, no DB call)
 */
export async function getCurrentUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding() {
  const user = await getCurrentUser();
  return user?.onboardingDone ?? false;
}
