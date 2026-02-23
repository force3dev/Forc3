"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";
import { CARDIO_TYPE_ICONS } from "@/lib/cardio-templates";

interface SetLog {
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  isPR?: boolean;
}

interface ExerciseLog {
  id: string;
  exercise: { name: string };
  sets: SetLog[];
}

interface WorkoutLog {
  id: string;
  kind: "strength";
  startedAt: string;
  completedAt?: string;
  duration?: number;
  overallRpe?: number;
  workout: { name: string };
  exerciseLogs: ExerciseLog[];
}

interface CardioLog {
  id: string;
  kind: "cardio";
  createdAt: string;
  type: string;
  title?: string | null;
  duration: number;
  distance?: number | null;
  intensity?: string | null;
  completed: boolean;
}

type AnyLog = (WorkoutLog | CardioLog) & { _date?: number };
type FilterTab = "week" | "month" | "all";

const INTENSITY_DOT: Record<string, string> = {
  easy: "bg-[#00C853]",
  moderate: "bg-yellow-400",
  hard: "bg-orange-400",
  max: "bg-red-400",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function HistoryPage() {
  const router = useRouter();
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [cardioLogs, setCardioLogs] = useState<CardioLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/workouts/log?limit=100").then(r => r.json()),
      fetch("/api/cardio/log").then(r => r.json()),
    ])
      .then(([wData, cData]) => {
        setWorkoutLogs((wData.logs || []).map((l: WorkoutLog) => ({ ...l, kind: "strength" })));
        setCardioLogs(
          ((cData.activities || []) as CardioLog[])
            .map((a: CardioLog) => ({ ...a, kind: "cardio" }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Merge and sort by date
  const allLogs = useMemo<AnyLog[]>(() => {
    const now = new Date();
    const cutoff: Record<FilterTab, Date> = {
      week: new Date(now.getTime() - 7 * 86400000),
      month: new Date(now.getTime() - 30 * 86400000),
      all: new Date(0),
    };
    const since = cutoff[filter];

    const filtered: AnyLog[] = [
      ...workoutLogs
        .filter(l => new Date(l.startedAt) >= since)
        .map(l => ({ ...l, _date: new Date(l.startedAt).getTime() })),
      ...cardioLogs
        .filter(l => new Date(l.createdAt) >= since)
        .map(l => ({ ...l, _date: new Date(l.createdAt).getTime() })),
    ];
    return filtered.sort((a, b) => (b._date ?? 0) - (a._date ?? 0));
  }, [workoutLogs, cardioLogs, filter]);

  // Weekly summaries
  const weeklySummary = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const weekCardio = cardioLogs.filter(c => new Date(c.createdAt) >= weekAgo && c.completed);
    const totalMins = weekCardio.reduce((s, c) => s + c.duration, 0);
    const totalDist = weekCardio.reduce((s, c) => s + (c.distance || 0), 0);
    const byType: Record<string, number> = {};
    weekCardio.forEach(c => { byType[c.type] = (byType[c.type] || 0) + c.duration; });
    return { totalMins, totalDist, byType, count: weekCardio.length };
  }, [cardioLogs]);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "week", label: "This Week" },
    { key: "month", label: "30 Days" },
    { key: "all", label: "All Time" },
  ];

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      <header className="px-6 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => router.back()} className="text-neutral-500 text-sm hover:text-white transition-colors">
            ← Back
          </button>
        </div>
        <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3</div>
        <h1 className="text-2xl font-bold mt-1">History</h1>
        <p className="text-sm text-neutral-500">{allLogs.length} sessions</p>
      </header>

      {/* Filter Tabs */}
      <div className="px-6 mb-4">
        <div className="flex bg-[#141414] border border-[#262626] rounded-xl p-1 gap-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === tab.key
                  ? "bg-[#0066FF] text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Cardio Volume Card */}
      {filter === "week" && weeklySummary.count > 0 && (
        <div className="px-6 mb-4">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
            <p className="text-xs text-neutral-500 uppercase tracking-wide mb-3">This Week — Cardio Volume</p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <div className="text-xl font-bold">{weeklySummary.count}</div>
                <div className="text-xs text-neutral-500 mt-0.5">Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{weeklySummary.totalMins}</div>
                <div className="text-xs text-neutral-500 mt-0.5">Minutes</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">
                  {weeklySummary.totalDist > 0 ? weeklySummary.totalDist.toFixed(1) : "—"}
                </div>
                <div className="text-xs text-neutral-500 mt-0.5">km</div>
              </div>
            </div>
            {Object.entries(weeklySummary.byType).length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {Object.entries(weeklySummary.byType).map(([type, mins]) => (
                  <span key={type} className="text-xs bg-[#0a0a0a] border border-[#262626] rounded-full px-2 py-1 text-neutral-400">
                    {CARDIO_TYPE_ICONS[type] || "🏃"} {type} · {mins}m
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary stats (strength) */}
      {workoutLogs.length > 0 && filter !== "week" && (
        <div className="px-6 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-3 text-center">
              <div className="text-xl font-bold">
                {workoutLogs.filter(l => {
                  const since = filter === "month" ? new Date(Date.now() - 30 * 86400000) : new Date(0);
                  return new Date(l.startedAt) >= since;
                }).length}
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">Strength Sessions</div>
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-3 text-center">
              <div className="text-xl font-bold">
                {cardioLogs.filter(c => {
                  const since = filter === "month" ? new Date(Date.now() - 30 * 86400000) : new Date(0);
                  return new Date(c.createdAt) >= since && c.completed;
                }).length}
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">Cardio Sessions</div>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 space-y-3">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && allLogs.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <div className="text-5xl">🏋️</div>
            <p className="font-semibold">
              {workoutLogs.length === 0 && cardioLogs.length === 0 ? "No sessions yet" : "No sessions in this period"}
            </p>
            <p className="text-sm text-neutral-500">
              {workoutLogs.length === 0 && cardioLogs.length === 0
                ? "Complete your first workout to see it here."
                : "Try a wider time range above."}
            </p>
            {workoutLogs.length === 0 && cardioLogs.length === 0 && (
              <button
                onClick={() => router.push("/home")}
                className="px-6 py-3 bg-[#0066FF] text-white font-bold rounded-xl"
              >
                Start Today&apos;s Workout
              </button>
            )}
          </div>
        )}

        {allLogs.map(log => {
          const isExpanded = expanded === log.id;

          if (log.kind === "cardio") {
            const c = log as CardioLog;
            const icon = CARDIO_TYPE_ICONS[c.type] || "🏃";
            const dotClass = INTENSITY_DOT[c.intensity || "moderate"] || INTENSITY_DOT.moderate;
            return (
              <div key={c.id} className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpanded(isExpanded ? null : c.id)}
                  className="w-full px-5 py-4 flex items-start justify-between text-left"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{c.title || c.type}</span>
                        <span className={`w-2 h-2 rounded-full ${dotClass}`} />
                        {c.completed && (
                          <span className="text-xs text-[#00C853]">✓</span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        {formatDate(c.createdAt)} · {c.duration} min
                        {c.distance ? ` · ${c.distance.toFixed(1)} km` : ""}
                        {c.intensity && <span className="capitalize"> · {c.intensity}</span>}
                      </div>
                    </div>
                  </div>
                  <span className="text-neutral-600 text-lg mt-1">{isExpanded ? "−" : "+"}</span>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 border-t border-[#1a1a1a] pt-3">
                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Cardio Session</p>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <div className="font-semibold">{c.duration}m</div>
                        <div className="text-xs text-neutral-500">Duration</div>
                      </div>
                      {c.distance && (
                        <div>
                          <div className="font-semibold">{c.distance.toFixed(1)} km</div>
                          <div className="text-xs text-neutral-500">Distance</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // Strength log
          const w = log as WorkoutLog;
          const logVolume = w.exerciseLogs.reduce((sum, el) =>
            sum + el.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0
          );
          const totalSets = w.exerciseLogs.reduce((sum, el) => sum + el.sets.length, 0);
          const hasPR = w.exerciseLogs.some(el => el.sets.some(s => s.isPR));

          return (
            <div key={w.id} className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpanded(isExpanded ? null : w.id)}
                className="w-full px-5 py-4 flex items-start justify-between text-left"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">🏋️</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{w.workout?.name || "Workout"}</span>
                      {hasPR && (
                        <span className="text-xs bg-[#FFB300]/20 text-[#FFB300] px-2 py-0.5 rounded-full border border-[#FFB300]/30">
                          PR!
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1 flex items-center gap-2">
                      <span>{formatDate(w.startedAt)}</span>
                      {w.duration && <span>· {w.duration} min</span>}
                      {totalSets > 0 && <span>· {totalSets} sets</span>}
                      {logVolume > 0 && (
                        <span>· {logVolume >= 1000 ? `${(logVolume / 1000).toFixed(1)}k` : Math.round(logVolume)} lbs</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-neutral-600 text-lg mt-1">{isExpanded ? "−" : "+"}</span>
              </button>

              {isExpanded && (
                <div className="border-t border-[#1a1a1a]">
                  {w.exerciseLogs.length > 0 ? (
                    <div className="divide-y divide-[#1a1a1a]">
                      {w.exerciseLogs.map(el => {
                        const best = el.sets.reduce<SetLog | null>(
                          (b, s) => (!b || s.weight > b.weight ? s : b),
                          null
                        );
                        return (
                          <div key={el.id} className="px-5 py-3 flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium">{el.exercise.name}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">{el.sets.length} sets</div>
                            </div>
                            {best && (
                              <div className="text-right">
                                <div className="text-sm font-semibold">
                                  {best.weight} × {best.reps}
                                  {best.isPR && <span className="ml-1 text-[#FFB300]">🏆</span>}
                                </div>
                                <div className="text-xs text-neutral-500">best set</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-5 py-3 text-sm text-neutral-500">No exercises logged</div>
                  )}

                  {w.overallRpe && (
                    <div className="px-5 py-3 border-t border-[#1a1a1a]">
                      <span className="text-xs text-neutral-500">Overall RPE: {w.overallRpe}/10</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <BottomNav active="home" />
    </main>
  );
}
