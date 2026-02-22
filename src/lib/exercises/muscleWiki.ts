// MuscleWiki provides muscle highlight images
// Using their public image endpoint (no API key required for basic use)

const MUSCLE_SLUG_MAP: Record<string, string> = {
  chest: "pectorals",
  back: "lats",
  shoulders: "deltoids",
  biceps: "biceps",
  triceps: "triceps",
  quads: "quads",
  hamstrings: "hamstrings",
  glutes: "glutes",
  calves: "calves",
  core: "abs",
  abs: "abs",
  lats: "lats",
};

export function getMuscleImageUrl(muscles: string[], view: "front" | "back" = "front"): string | null {
  if (!muscles || muscles.length === 0) return null;
  const primary = muscles[0]?.toLowerCase();
  const slug = MUSCLE_SLUG_MAP[primary] || primary;
  // MuscleWiki public URL pattern
  return `https://musclewiki.com/media/uploads/male-${view}-${slug}.png`;
}
