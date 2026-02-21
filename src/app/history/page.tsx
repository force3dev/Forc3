"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";

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
  startedAt: string;
  completedAt?: string;
  duration?: number;
  overallRpe?: number;
  notes?: string;
  workout: { name: string };
  exerciseLogs: ExerciseLog[];
}

type FilterTab = "week" | "month" | "all";

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
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");

  useEffect(() => {
    fetch("/api/workouts/log?limit=100")
      .then(r => r.json())
      .then(d => setLogs(d.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = useMemo(() => {
    const now = new Date();
    if (filter === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return logs.filter(l => new Date(l.startedAt) >= weekAgo);
    }
    if (filter === "month") {
      const monthAgo = new Date(now);
      monthAgo.setDate(now.getDate() - 30);
      return logs.filter(l => new Date(l.startedAt) >= monthAgo);
    }
    return logs;
  }, [logs, filter]);

  const totalVolume = useMemo(() =>
    filteredLogs.reduce((sum, log) =>
      sum + log.exerciseLogs.reduce((s, el) =>
        s + el.sets.reduce((ss, set) => ss + set.weight * set.reps, 0), 0
      ), 0
  ), [filteredLogs]);

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
        <p className="text-sm text-neutral-500">{filteredLogs.length} workouts</p>
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

      {/* Summary stats */}
      {filteredLogs.length > 0 && (
        <div className="px-6 mb-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-3 text-center">
              <div className="text-xl font-bold">{filteredLogs.length}</div>
              <div className="text-xs text-neutral-500 mt-0.5">Workouts</div>
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-3 text-center">
              <div className="text-xl font-bold">
                {filteredLogs.reduce((s, l) => s + (l.duration || 0), 0)}
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">Minutes</div>
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-3 text-center">
              <div className="text-xl font-bold">
                {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : Math.round(totalVolume)}
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">Lbs</div>
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

        {!loading && filteredLogs.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <div className="text-5xl">🏋️</div>
            <p className="font-semibold">
              {logs.length === 0 ? "No workouts yet" : `No workouts in this period`}
            </p>
            <p className="text-sm text-neutral-500">
              {logs.length === 0
                ? "Complete your first workout to see it here."
                : "Try a wider time range above."}
            </p>
            {logs.length === 0 && (
              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-3 bg-[#0066FF] text-white font-bold rounded-xl"
              >
                Start Today&apos;s Workout
              </button>
            )}
          </div>
        )}

        {filteredLogs.map(log => {
          const isExpanded = expanded === log.id;
          const logVolume = log.exerciseLogs.reduce((sum, el) =>
            sum + el.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0
          );
          const totalSets = log.exerciseLogs.reduce((sum, el) => sum + el.sets.length, 0);
          const hasPR = log.exerciseLogs.some(el => el.sets.some(s => s.isPR));

          return (
            <div key={log.id} className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpanded(isExpanded ? null : log.id)}
                className="w-full px-5 py-4 flex items-start justify-between text-left"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{log.workout?.name || "Workout"}</span>
                    {hasPR && (
                      <span className="text-xs bg-[#FFB300]/20 text-[#FFB300] px-2 py-0.5 rounded-full border border-[#FFB300]/30">
                        PR!
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1 flex items-center gap-2">
                    <span>{formatDate(log.startedAt)}</span>
                    {log.duration && <span>· {log.duration} min</span>}
                    {totalSets > 0 && <span>· {totalSets} sets</span>}
                    {logVolume > 0 && (
                      <span>· {logVolume >= 1000 ? `${(logVolume / 1000).toFixed(1)}k` : Math.round(logVolume)} lbs</span>
                    )}
                  </div>
                </div>
                <span className="text-neutral-600 text-lg mt-1">{isExpanded ? "−" : "+"}</span>
              </button>

              {isExpanded && (
                <div className="border-t border-[#1a1a1a]">
                  {log.exerciseLogs.length > 0 ? (
                    <div className="divide-y divide-[#1a1a1a]">
                      {log.exerciseLogs.map(el => {
                        const best = el.sets.reduce<SetLog | null>(
                          (b, s) => (!b || s.weight > b.weight ? s : b),
                          null
                        );
                        return (
                          <div key={el.id} className="px-5 py-3 flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium">{el.exercise.name}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">
                                {el.sets.length} sets
                              </div>
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

                  {log.overallRpe && (
                    <div className="px-5 py-3 border-t border-[#1a1a1a]">
                      <span className="text-xs text-neutral-500">Overall RPE: {log.overallRpe}/10</span>
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
