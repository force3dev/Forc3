"use client";

import { useState } from "react";

// Muscle group → SVG path IDs mapping
const MUSCLE_MAP: Record<string, { front: string[]; back: string[] }> = {
  chest: { front: ["chest-left", "chest-right"], back: [] },
  "upper chest": { front: ["upper-chest-left", "upper-chest-right"], back: [] },
  back: { front: [], back: ["lats-left", "lats-right", "traps-upper"] },
  lats: { front: [], back: ["lats-left", "lats-right"] },
  traps: { front: [], back: ["traps-upper", "traps-mid"] },
  shoulders: { front: ["front-delt-left", "front-delt-right"], back: ["rear-delt-left", "rear-delt-right"] },
  "front deltoid": { front: ["front-delt-left", "front-delt-right"], back: [] },
  "rear deltoid": { front: [], back: ["rear-delt-left", "rear-delt-right"] },
  biceps: { front: ["bicep-left", "bicep-right"], back: [] },
  triceps: { front: [], back: ["tricep-left", "tricep-right"] },
  forearms: { front: ["forearm-left", "forearm-right"], back: [] },
  quadriceps: { front: ["quad-left", "quad-right"], back: [] },
  hamstrings: { front: [], back: ["ham-left", "ham-right"] },
  glutes: { front: [], back: ["glute-left", "glute-right"] },
  calves: { front: [], back: ["calf-left", "calf-right"] },
  abs: { front: ["abs-upper", "abs-lower", "oblique-left", "oblique-right"], back: [] },
  core: { front: ["abs-upper", "abs-lower", "oblique-left", "oblique-right"], back: [] },
  obliques: { front: ["oblique-left", "oblique-right"], back: [] },
};

type MuscleDiagramProps = {
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  size?: "sm" | "md" | "lg";
};

function getActiveMuscleIds(muscles: string[], type: "front" | "back") {
  const ids = new Set<string>();
  for (const m of muscles) {
    const key = m.toLowerCase();
    for (const [mapKey, val] of Object.entries(MUSCLE_MAP)) {
      if (key.includes(mapKey) || mapKey.includes(key)) {
        val[type].forEach(id => ids.add(id));
      }
    }
  }
  return ids;
}

export default function MuscleDiagram({
  primaryMuscles,
  secondaryMuscles = [],
  size = "md",
}: MuscleDiagramProps) {
  const [view, setView] = useState<"front" | "back">("front");

  const primaryIds = getActiveMuscleIds(primaryMuscles, view);
  const secondaryIds = getActiveMuscleIds(secondaryMuscles, view);

  const sizeClass =
    size === "sm" ? "w-28 h-44" : size === "lg" ? "w-56 h-88" : "w-40 h-64";

  function fillFor(id: string) {
    if (primaryIds.has(id)) return "#0066FF";
    if (secondaryIds.has(id)) return "#0066FF66";
    return "#2a2a2a";
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Toggle */}
      <div className="flex bg-[#1a1a1a] rounded-full p-0.5 text-xs">
        {(["front", "back"] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1 rounded-full capitalize transition-colors ${
              view === v ? "bg-[#0066FF] text-white" : "text-neutral-400"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* SVG Body */}
      <div className={sizeClass}>
        <svg viewBox="0 0 120 200" className="w-full h-full">
          {view === "front" ? (
            <FrontBody fillFor={fillFor} />
          ) : (
            <BackBody fillFor={fillFor} />
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-neutral-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-[#0066FF] inline-block" />
          Primary
        </span>
        {secondaryMuscles.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-[#0066FF66] inline-block" />
            Secondary
          </span>
        )}
      </div>
    </div>
  );
}

// ── Front Body SVG ─────────────────────────────────────────────────────────

function FrontBody({ fillFor }: { fillFor: (id: string) => string }) {
  return (
    <g>
      {/* Head */}
      <ellipse cx="60" cy="14" rx="10" ry="12" fill="#3a3a3a" />
      {/* Neck */}
      <rect x="55" y="24" width="10" height="6" rx="2" fill="#3a3a3a" />
      {/* Torso */}
      <rect x="40" y="30" width="40" height="50" rx="4" fill="#2a2a2a" />
      {/* Chest Left */}
      <ellipse id="chest-left" cx="50" cy="40" rx="9" ry="8" fill={fillFor("chest-left")} />
      {/* Chest Right */}
      <ellipse id="chest-right" cx="70" cy="40" rx="9" ry="8" fill={fillFor("chest-right")} />
      {/* Upper Chest Left */}
      <ellipse id="upper-chest-left" cx="50" cy="33" rx="7" ry="4" fill={fillFor("upper-chest-left")} opacity="0.7" />
      {/* Upper Chest Right */}
      <ellipse id="upper-chest-right" cx="70" cy="33" rx="7" ry="4" fill={fillFor("upper-chest-right")} opacity="0.7" />
      {/* Front Delts */}
      <ellipse id="front-delt-left" cx="37" cy="35" rx="6" ry="7" fill={fillFor("front-delt-left")} />
      <ellipse id="front-delt-right" cx="83" cy="35" rx="6" ry="7" fill={fillFor("front-delt-right")} />
      {/* Abs */}
      <rect id="abs-upper" x="53" y="50" width="14" height="10" rx="3" fill={fillFor("abs-upper")} />
      <rect id="abs-lower" x="53" y="62" width="14" height="10" rx="3" fill={fillFor("abs-lower")} />
      {/* Obliques */}
      <ellipse id="oblique-left" cx="46" cy="62" rx="5" ry="9" fill={fillFor("oblique-left")} />
      <ellipse id="oblique-right" cx="74" cy="62" rx="5" ry="9" fill={fillFor("oblique-right")} />
      {/* Upper Arms (Biceps) */}
      <rect id="bicep-left" x="28" y="43" width="9" height="22" rx="4" fill={fillFor("bicep-left")} />
      <rect id="bicep-right" x="83" y="43" width="9" height="22" rx="4" fill={fillFor("bicep-right")} />
      {/* Forearms */}
      <rect id="forearm-left" x="27" y="67" width="8" height="20" rx="3" fill={fillFor("forearm-left")} />
      <rect id="forearm-right" x="85" y="67" width="8" height="20" rx="3" fill={fillFor("forearm-right")} />
      {/* Hips */}
      <rect x="40" y="80" width="40" height="10" rx="4" fill="#2a2a2a" />
      {/* Quads */}
      <rect id="quad-left" x="41" y="92" width="17" height="36" rx="5" fill={fillFor("quad-left")} />
      <rect id="quad-right" x="62" y="92" width="17" height="36" rx="5" fill={fillFor("quad-right")} />
      {/* Shins */}
      <rect x="42" y="130" width="15" height="30" rx="4" fill="#2a2a2a" />
      <rect x="63" y="130" width="15" height="30" rx="4" fill="#2a2a2a" />
      {/* Feet */}
      <ellipse cx="50" cy="163" rx="9" ry="5" fill="#2a2a2a" />
      <ellipse cx="70" cy="163" rx="9" ry="5" fill="#2a2a2a" />
    </g>
  );
}

// ── Back Body SVG ──────────────────────────────────────────────────────────

function BackBody({ fillFor }: { fillFor: (id: string) => string }) {
  return (
    <g>
      {/* Head */}
      <ellipse cx="60" cy="14" rx="10" ry="12" fill="#3a3a3a" />
      {/* Neck */}
      <rect x="55" y="24" width="10" height="6" rx="2" fill="#3a3a3a" />
      {/* Torso */}
      <rect x="40" y="30" width="40" height="50" rx="4" fill="#2a2a2a" />
      {/* Traps Upper */}
      <path id="traps-upper" d="M47 30 Q60 26 73 30 L70 38 Q60 34 50 38 Z" fill={fillFor("traps-upper")} />
      {/* Traps Mid */}
      <ellipse id="traps-mid" cx="60" cy="44" rx="13" ry="7" fill={fillFor("traps-mid")} />
      {/* Lats */}
      <path id="lats-left" d="M40 35 L48 35 L45 75 L40 80 Z" rx="3" fill={fillFor("lats-left")} />
      <path id="lats-right" d="M80 35 L72 35 L75 75 L80 80 Z" fill={fillFor("lats-right")} />
      {/* Rear Delts */}
      <ellipse id="rear-delt-left" cx="37" cy="35" rx="6" ry="7" fill={fillFor("rear-delt-left")} />
      <ellipse id="rear-delt-right" cx="83" cy="35" rx="6" ry="7" fill={fillFor("rear-delt-right")} />
      {/* Triceps */}
      <rect id="tricep-left" x="28" y="43" width="9" height="22" rx="4" fill={fillFor("tricep-left")} />
      <rect id="tricep-right" x="83" y="43" width="9" height="22" rx="4" fill={fillFor("tricep-right")} />
      {/* Forearms Back */}
      <rect x="27" y="67" width="8" height="20" rx="3" fill="#2a2a2a" />
      <rect x="85" y="67" width="8" height="20" rx="3" fill="#2a2a2a" />
      {/* Lower Back */}
      <rect x="48" y="62" width="24" height="18" rx="3" fill="#2a2a2a" />
      {/* Hips */}
      <rect x="40" y="80" width="40" height="10" rx="4" fill="#2a2a2a" />
      {/* Glutes */}
      <ellipse id="glute-left" cx="50" cy="92" rx="11" ry="10" fill={fillFor("glute-left")} />
      <ellipse id="glute-right" cx="70" cy="92" rx="11" ry="10" fill={fillFor("glute-right")} />
      {/* Hamstrings */}
      <rect id="ham-left" x="41" y="102" width="17" height="26" rx="5" fill={fillFor("ham-left")} />
      <rect id="ham-right" x="62" y="102" width="17" height="26" rx="5" fill={fillFor("ham-right")} />
      {/* Calves */}
      <ellipse id="calf-left" cx="50" cy="138" rx="9" ry="14" fill={fillFor("calf-left")} />
      <ellipse id="calf-right" cx="70" cy="138" rx="9" ry="14" fill={fillFor("calf-right")} />
      {/* Feet */}
      <ellipse cx="50" cy="155" rx="9" ry="5" fill="#2a2a2a" />
      <ellipse cx="70" cy="155" rx="9" ry="5" fill="#2a2a2a" />
    </g>
  );
}
