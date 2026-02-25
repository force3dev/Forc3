"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CARDIO_TEMPLATES,
  CARDIO_TYPE_ICONS,
  INTENSITY_COLORS,
  type CardioTemplate,
} from "@/lib/cardio-templates";

const TYPE_ORDER = ["run", "sprint", "swim", "bike", "row", "hiit"] as const;
const TYPE_LABELS: Record<string, string> = {
  run: "Running",
  sprint: "Sprints",
  swim: "Swimming",
  bike: "Cycling",
  row: "Rowing",
  hiit: "HIIT",
};

export default function CardioPage() {
  const router = useRouter();
  const [recoveryScore, setRecoveryScore] = useState<number | null>(null);
  const [recommended, setRecommended] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["run", "sprint"]));

  useEffect(() => {
    fetch("/api/cardio/recommendations")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.recoveryScore === "number") setRecoveryScore(d.recoveryScore);
        // Find recommended template
        for (const g of d.groups || []) {
          const rec = g.options?.find((o: { recommended?: boolean }) => o.recommended);
          if (rec) { setRecommended(rec.id); break; }
        }
      })
      .catch(() => {});
  }, []);

  // Group templates by type
  const grouped: Record<string, CardioTemplate[]> = {};
  for (const t of CARDIO_TEMPLATES) {
    const key = t.type === "sprint" ? "run" : t.type;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  }

  function toggleSection(type: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  const recoveryColor =
    recoveryScore === null ? "text-neutral-500" :
    recoveryScore >= 80 ? "text-[#00C853]" :
    recoveryScore >= 60 ? "text-yellow-400" :
    recoveryScore >= 40 ? "text-orange-400" : "text-red-400";

  const recoveryLabel =
    recoveryScore === null ? "" :
    recoveryScore >= 80 ? "Excellent" :
    recoveryScore >= 60 ? "Good" :
    recoveryScore >= 40 ? "Moderate" : "Low";

  return (
    <main className="min-h-screen bg-black text-white pb-6">
      {/* Header */}
      <header className="px-5 pt-8 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-neutral-400 hover:text-white transition-colors">
            {"\u2190"}
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Cardio</h1>
            <p className="text-xs text-neutral-500 mt-0.5">Choose a workout and start</p>
          </div>
          {recoveryScore !== null && (
            <div className={`px-3 py-1.5 rounded-xl border ${
              recoveryScore >= 80 ? "border-[#00C853]/30 bg-[#00C853]/10" :
              recoveryScore >= 60 ? "border-yellow-400/30 bg-yellow-400/10" :
              recoveryScore >= 40 ? "border-orange-400/30 bg-orange-400/10" :
              "border-red-400/30 bg-red-400/10"
            }`}>
              <div className={`text-xs font-bold ${recoveryColor}`}>
                Recovery {recoveryScore}%
              </div>
              <div className="text-[10px] text-neutral-500">{recoveryLabel}</div>
            </div>
          )}
        </div>
      </header>

      <div className="px-5 space-y-4">
        {/* Recommended workout highlight */}
        {recommended && (() => {
          const rec = CARDIO_TEMPLATES.find(t => t.id === recommended);
          if (!rec) return null;
          return (
            <div className="rounded-2xl border border-[#0066FF]/40 bg-gradient-to-br from-[#0066FF]/10 to-[#0066FF]/5 p-4">
              <p className="text-xs font-bold text-[#8bb7ff] uppercase tracking-wide mb-3">
                {"\u2B50"} Recommended for you
              </p>
              <TemplateCard template={rec} isRecommended onStart={() => router.push(`/workout/cardio/${rec.id}`)} />
            </div>
          );
        })()}

        {/* All templates grouped by type */}
        {TYPE_ORDER.map((type) => {
          const templates = grouped[type];
          if (!templates || templates.length === 0) return null;
          const isOpen = expanded.has(type);
          const icon = CARDIO_TYPE_ICONS[type] || "\u{1F3C3}";
          const label = TYPE_LABELS[type] || type;

          return (
            <div key={type}>
              <button
                onClick={() => toggleSection(type)}
                className="w-full flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{icon}</span>
                  <span className="font-bold text-lg">{label}</span>
                  <span className="text-xs text-neutral-600">{templates.length} workouts</span>
                </div>
                <span className={`text-neutral-500 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                  {"\u25BC"}
                </span>
              </button>

              {isOpen && (
                <div className="space-y-3 pb-2">
                  {templates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isRecommended={template.id === recommended}
                      onStart={() => router.push(`/workout/cardio/${template.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}

function TemplateCard({
  template,
  isRecommended,
  onStart,
}: {
  template: CardioTemplate;
  isRecommended: boolean;
  onStart: () => void;
}) {
  const intensityClass = INTENSITY_COLORS[template.intensity] || "";

  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        isRecommended ? "border-[#0066FF]/30 bg-[#0a0a0a]" : "border-[#262626] bg-[#141414]"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{template.title}</p>
            {isRecommended && (
              <span className="text-[10px] bg-[#0066FF]/20 text-[#0066FF] px-1.5 py-0.5 rounded font-semibold">
                REC
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{template.description}</p>
        </div>
        <span
          className={`px-2.5 py-1 text-[10px] font-bold rounded-full border capitalize flex-shrink-0 ${intensityClass}`}
        >
          {template.intensity}
        </span>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500">{template.duration} min</span>
          {template.intervals && (
            <span className="text-xs text-neutral-600">
              {template.intervals.reduce((s, iv) => s + iv.reps, 0)} intervals
            </span>
          )}
          {template.tags && template.tags.length > 0 && (
            <span className="text-[10px] text-neutral-600 bg-[#1a1a1a] px-2 py-0.5 rounded-full">
              {template.tags[0]}
            </span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onStart(); }}
          className="px-4 py-2 bg-[#0066FF] text-white text-sm font-bold rounded-xl hover:bg-[#0052CC] transition-colors"
        >
          Start
        </button>
      </div>
    </div>
  );
}
