"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Recommendation = {
  id: string;
  title: string;
  description: string;
  duration: number;
  intensity: "easy" | "moderate" | "hard" | "max";
  recommended: boolean;
};

type Group = {
  type: string;
  options: Recommendation[];
};

const TYPE_META: Record<string, { label: string; icon: string }> = {
  run: { label: "Run", icon: "🏃" },
  swim: { label: "Swim", icon: "🏊" },
  bike: { label: "Bike", icon: "🚴" },
  row: { label: "Row", icon: "🚣" },
  hiit: { label: "HIIT", icon: "⚡" },
};

const INTENSITY_BADGE: Record<string, string> = {
  easy: "text-[#22c55e] border-[#22c55e]/40 bg-[#22c55e]/10",
  moderate: "text-yellow-300 border-yellow-300/40 bg-yellow-300/10",
  hard: "text-red-400 border-red-400/40 bg-red-400/10",
  max: "text-purple-300 border-purple-300/40 bg-purple-300/10",
};

export default function CardioActivitiesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [recoveryScore, setRecoveryScore] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/cardio/recommendations")
      .then((r) => r.json())
      .then((d) => {
        setGroups(d.groups || []);
        setRecoveryScore(typeof d.recoveryScore === "number" ? d.recoveryScore : null);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.type === selectedType) || null,
    [groups, selectedType]
  );

  const recommended = useMemo(
    () => selectedGroup?.options.find((o) => o.recommended) || null,
    [selectedGroup]
  );

  return (
    <main className="min-h-screen bg-black text-white pb-6">
      <header className="px-5 pt-8 pb-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-neutral-400 hover:text-white transition-colors">
          ←
        </button>
        <div>
          <h1 className="text-2xl font-bold">Cardio</h1>
          {recoveryScore !== null && <p className="text-xs text-neutral-500">Recovery score: {recoveryScore}</p>}
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-14">
          <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-5 space-y-5">
          <section>
            <h2 className="font-semibold mb-3">What type of cardio?</h2>
            <div className="grid grid-cols-2 gap-3">
              {groups.map((group) => {
                const meta = TYPE_META[group.type] || { label: group.type, icon: "🏃" };
                return (
                  <button
                    key={group.type}
                    onClick={() => setSelectedType(group.type)}
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      selectedType === group.type
                        ? "border-[#0066FF] bg-[#0066FF]/10"
                        : "border-[#262626] bg-[#141414] hover:border-[#3a3a3a]"
                    }`}
                  >
                    <div className="text-2xl mb-2">{meta.icon}</div>
                    <div className="font-semibold">{meta.label}</div>
                  </button>
                );
              })}
            </div>
          </section>

          {selectedGroup && (
            <section className="space-y-3">
              <h2 className="font-semibold">Choose Your {TYPE_META[selectedGroup.type]?.label || selectedGroup.type}</h2>

              {recommended && (
                <div className="rounded-2xl border border-[#0066FF]/40 bg-[#0066FF]/10 p-4">
                  <p className="text-xs font-semibold text-[#8bb7ff] mb-2">⭐ Recommended for you</p>
                  <CardioOption option={recommended} onSelect={(id) => router.push(`/workout/cardio/${id}`)} />
                </div>
              )}

              <div className="space-y-3">
                {selectedGroup.options
                  .filter((o) => !o.recommended)
                  .map((option) => (
                    <CardioOption key={option.id} option={option} onSelect={(id) => router.push(`/workout/cardio/${id}`)} />
                  ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}

function CardioOption({ option, onSelect }: { option: Recommendation; onSelect: (id: string) => void }) {
  return (
    <button
      onClick={() => onSelect(option.id)}
      className="w-full rounded-2xl border border-[#262626] bg-[#141414] p-4 text-left hover:border-[#3a3a3a] transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{option.title}</p>
          <p className="text-xs text-neutral-400 mt-1">{option.description}</p>
        </div>
        <span className={`px-2 py-1 text-[10px] font-semibold rounded-full border ${INTENSITY_BADGE[option.intensity] || ""}`}>
          {option.intensity}
        </span>
      </div>
      <p className="text-xs text-neutral-500 mt-3">{option.duration} min</p>
    </button>
  );
}
