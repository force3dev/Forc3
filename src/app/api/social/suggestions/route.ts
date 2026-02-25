import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/social/suggestions
 * Returns up to 8 user suggestions based on:
 * 1. Similar training goals (same program type / race goal)
 * 2. Mutual followers
 * 3. Active users not already followed, not blocked
 */
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get current user's profile and who they already follow
  const [profile, following, blocks] = await Promise.all([
    prisma.profile.findUnique({ where: { userId }, select: { goal: true } }),
    prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
    prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    }),
  ]);

  const followingIds = new Set(following.map((f) => f.followingId));
  followingIds.add(userId); // exclude self

  const blockedIds = new Set<string>();
  for (const b of blocks) {
    blockedIds.add(b.blockerId);
    blockedIds.add(b.blockedId);
  }

  const exclude = new Set([...followingIds, ...blockedIds]);

  // Get mutual follower suggestions: people who follow the same people I follow
  const mutualCandidates = await prisma.follow.findMany({
    where: {
      followerId: { in: [...followingIds].filter((id) => id !== userId) },
      followingId: { notIn: [...exclude] },
    },
    select: { followingId: true },
    take: 50,
  });

  // Count frequency of each candidate
  const freq = new Map<string, number>();
  for (const c of mutualCandidates) {
    freq.set(c.followingId, (freq.get(c.followingId) || 0) + 1);
  }

  // Sort by mutual count (most mutual first)
  const sortedByMutual = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id);

  // If not enough mutual suggestions, pad with active users with similar goal
  let candidateIds = [...sortedByMutual];
  if (candidateIds.length < 6) {
    const goalFilter = profile?.goal
      ? { profile: { goal: profile.goal } }
      : {};

    const byGoal = await prisma.user.findMany({
      where: {
        id: { notIn: [...exclude, ...candidateIds] },
        ...goalFilter,
        streak: { currentStreak: { gte: 1 } },
      },
      select: { id: true },
      take: 8 - candidateIds.length,
      orderBy: { streak: { currentStreak: "desc" } },
    });
    candidateIds = [...candidateIds, ...byGoal.map((u) => u.id)];
  }

  // If still not enough, pad with any active users
  if (candidateIds.length < 4) {
    const fallback = await prisma.user.findMany({
      where: {
        id: { notIn: [...exclude, ...candidateIds] },
        streak: { currentStreak: { gte: 1 } },
      },
      select: { id: true },
      take: 6,
      orderBy: { streak: { currentStreak: "desc" } },
    });
    candidateIds = [...candidateIds, ...fallback.map((u) => u.id)];
  }

  if (candidateIds.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  const users = await prisma.user.findMany({
    where: { id: { in: candidateIds } },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      isPrivate: true,
      streak: { select: { currentStreak: true, level: true } },
      profile: { select: { goal: true } },
      _count: { select: { followers: true } },
    },
    take: 8,
  });

  const suggestions = users.map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    isPrivate: u.isPrivate,
    followerCount: u._count.followers,
    streak: u.streak?.currentStreak || 0,
    level: u.streak?.level || 1,
    goal: u.profile?.goal || null,
    mutualCount: freq.get(u.id) || 0,
    isFollowing: false,
  }));

  return NextResponse.json({ suggestions });
}
