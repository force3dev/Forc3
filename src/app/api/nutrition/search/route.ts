import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { searchOpenFoodFacts } from "@/lib/nutrition/openFoodFacts";
import { searchUSDA } from "@/lib/nutrition/usda";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Search both databases in parallel, tolerate failures
  const [offResults, usdaResults] = await Promise.all([
    searchOpenFoodFacts(query).catch(() => []),
    searchUSDA(query).catch(() => []),
  ]);

  // Combine and sort by name relevance
  const combined = [...usdaResults, ...offResults];
  const lowerQ = query.toLowerCase();
  combined.sort((a, b) => {
    const aExact = a.name.toLowerCase().startsWith(lowerQ);
    const bExact = b.name.toLowerCase().startsWith(lowerQ);
    const aContains = a.name.toLowerCase().includes(lowerQ);
    const bContains = b.name.toLowerCase().includes(lowerQ);
    if (aExact && !bExact) return -1;
    if (bExact && !aExact) return 1;
    if (aContains && !bContains) return -1;
    if (bContains && !aContains) return 1;
    return 0;
  });

  // Filter out entries with 0 calories (bad data)
  const filtered = combined.filter(f => f.calories > 0);

  return NextResponse.json({ results: filtered.slice(0, 20) });
}
