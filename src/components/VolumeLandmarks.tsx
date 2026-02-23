"use client";

import { useEffect, useState } from "react";

type Landmark = {
  muscle: string;
  label: string;
  sets: number;
  mev: number;
  mav: number;
  zone: "below_mev" | "optimal" | "above_mav";
};

const ZONE_COLORS = {
  below_mev: { bar: "#6b7280", text: "text-neutral-500", label: "Below MEV" },
  optimal: { bar: "#00C853", text: "text-[#00C853]", label: "Optimal" },
  above_mav: { bar: "#ef4444", text: "text-red-400", label: "Over MAV" },
};

export default function VolumeLandmarks() {
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/progress/volume-landmarks")
      .then((r) => r.json())
      .then((d) => setLandmarks(d.landmarks || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  const display = expanded ? landmarks : landmarks.filter((l) => l.sets > 0).slice(0, 5);
  const hasData = landmarks.some((l) => l.sets > 0);

  if (!hasData) return null;

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Volume Landmarks</p>
          <p className="text-xs text-neutral-600 mt-0.5">Weekly sets vs MEV/MAV targets</p>
        </div>
        <button onClick={() => setExpanded((e) => !e)} className="text-xs text-[#0066FF]">
          {expanded ? "Less" : "All"}
        </button>
      </div>

      <div className="space-y-3">
        {display.map((l) => {
          const zone = ZONE_COLORS[l.zone];
          const barPct = Math.min(100, (l.sets / l.mav) * 100);
          const mevPct = (l.mev / l.mav) * 100;

          return (
            <div key={l.muscle}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-white font-medium">{l.label}</span>
                <span className={`font-semibold ${zone.text}`}>
                  {l.sets} sets · {zone.label}
                </span>
              </div>
              <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden relative">
                {/* MEV marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-neutral-600 z-10"
                  style={{ left: `${mevPct}%` }}
                />
                {/* Progress bar */}
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${barPct}%`, background: zone.bar }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-neutral-700 mt-0.5">
                <span>0</span>
                <span style={{ marginLeft: `${mevPct - 5}%` }}>MEV {l.mev}</span>
                <span>MAV {l.mav}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-neutral-700 mt-3">MEV = Minimum Effective Volume · MAV = Maximum Adaptive Volume (Israetel)</p>
    </div>
  );
}
