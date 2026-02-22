"use client";

interface Props {
  primary: string[];
  secondary?: string[];
}

// Muscle color helper
function muscleColor(name: string, primary: string[], secondary: string[]): string {
  const n = name.toLowerCase();
  if (primary.some(m => m.toLowerCase() === n)) return "#0066FF";
  if (secondary.some(m => m.toLowerCase() === n)) return "#003d99";
  return "#2a2a2a";
}

export function MuscleHighlightDiagram({ primary, secondary = [] }: Props) {
  const c = (name: string) => muscleColor(name, primary, secondary);

  return (
    <div className="flex justify-center gap-6">
      {/* Front View */}
      <div className="text-center">
        <p className="text-[10px] text-neutral-600 mb-1 uppercase tracking-wide">Front</p>
        <svg viewBox="0 0 100 200" className="w-20 h-40" xmlns="http://www.w3.org/2000/svg">
          {/* Head */}
          <ellipse cx="50" cy="16" rx="12" ry="14" fill="#444" />
          {/* Neck */}
          <rect x="45" y="28" width="10" height="8" fill="#444" />
          {/* Chest */}
          <ellipse cx="50" cy="52" rx="22" ry="14" fill={c("chest")} />
          {/* Left shoulder */}
          <ellipse cx="24" cy="46" rx="9" ry="8" fill={c("shoulders")} />
          {/* Right shoulder */}
          <ellipse cx="76" cy="46" rx="9" ry="8" fill={c("shoulders")} />
          {/* Left bicep */}
          <rect x="13" y="55" width="10" height="22" rx="5" fill={c("biceps")} />
          {/* Right bicep */}
          <rect x="77" y="55" width="10" height="22" rx="5" fill={c("biceps")} />
          {/* Left forearm */}
          <rect x="11" y="78" width="9" height="20" rx="4" fill="#333" />
          {/* Right forearm */}
          <rect x="80" y="78" width="9" height="20" rx="4" fill="#333" />
          {/* Abs */}
          <rect x="36" y="66" width="28" height="32" rx="4" fill={c("core")} />
          {/* Abs lines */}
          <line x1="50" y1="68" x2="50" y2="96" stroke="#1a1a1a" strokeWidth="1.5" />
          <line x1="36" y1="76" x2="64" y2="76" stroke="#1a1a1a" strokeWidth="1.5" />
          <line x1="36" y1="86" x2="64" y2="86" stroke="#1a1a1a" strokeWidth="1.5" />
          {/* Left quad */}
          <ellipse cx="40" cy="130" rx="12" ry="24" fill={c("quads")} />
          {/* Right quad */}
          <ellipse cx="60" cy="130" rx="12" ry="24" fill={c("quads")} />
          {/* Left calf */}
          <ellipse cx="40" cy="172" rx="8" ry="16" fill={c("calves")} />
          {/* Right calf */}
          <ellipse cx="60" cy="172" rx="8" ry="16" fill={c("calves")} />
        </svg>
      </div>

      {/* Back View */}
      <div className="text-center">
        <p className="text-[10px] text-neutral-600 mb-1 uppercase tracking-wide">Back</p>
        <svg viewBox="0 0 100 200" className="w-20 h-40" xmlns="http://www.w3.org/2000/svg">
          {/* Head */}
          <ellipse cx="50" cy="16" rx="12" ry="14" fill="#444" />
          {/* Neck */}
          <rect x="45" y="28" width="10" height="8" fill="#444" />
          {/* Left shoulder */}
          <ellipse cx="24" cy="46" rx="9" ry="8" fill={c("shoulders")} />
          {/* Right shoulder */}
          <ellipse cx="76" cy="46" rx="9" ry="8" fill={c("shoulders")} />
          {/* Back / Lats */}
          <path d="M28 38 Q50 36 72 38 Q72 70 64 80 Q50 84 36 80 Q28 70 28 38Z" fill={c("back")} />
          {/* Left tricep */}
          <rect x="13" y="55" width="10" height="22" rx="5" fill={c("triceps")} />
          {/* Right tricep */}
          <rect x="77" y="55" width="10" height="22" rx="5" fill={c("triceps")} />
          {/* Left forearm */}
          <rect x="11" y="78" width="9" height="20" rx="4" fill="#333" />
          {/* Right forearm */}
          <rect x="80" y="78" width="9" height="20" rx="4" fill="#333" />
          {/* Glutes */}
          <ellipse cx="50" cy="102" rx="20" ry="14" fill={c("glutes")} />
          {/* Left hamstring */}
          <ellipse cx="40" cy="130" rx="11" ry="22" fill={c("hamstrings")} />
          {/* Right hamstring */}
          <ellipse cx="60" cy="130" rx="11" ry="22" fill={c("hamstrings")} />
          {/* Left calf */}
          <ellipse cx="40" cy="172" rx="8" ry="16" fill={c("calves")} />
          {/* Right calf */}
          <ellipse cx="60" cy="172" rx="8" ry="16" fill={c("calves")} />
        </svg>
      </div>
    </div>
  );
}
