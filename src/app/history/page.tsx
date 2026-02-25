"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";

interface SetEntry { weight: number; reps: number }
interface ExerciseEntry { name: string; sets: SetEntry[] }
interface WorkoutEntry {
  id: string;
  name: string;
  startedAt: string;
  duration: number | null;
  totalVolume: number;
  exercises: ExerciseEntry[];
  completed: boolean;
}

type FilterType = "all" | "week" | "month";

function formatDuration(mins: number) {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function groupByWeek(workouts: WorkoutEntry[]) {
  const groups: Record<string, WorkoutEntry[]> = {};
  for (const w of workouts) {
    const d = new Date(w.startedAt);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    if (!groups[key]) groups[key] = [];
    groups[key].push(w);
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

export default function HistoryPage() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/workouts/log?limit=200")
      .then(r => r.json())
      .then(d => {
        const logs = d.logs || [];
        const mapped: WorkoutEntry[] = logs.map((l: {
          id: string;
          startedAt: string;
          completedAt: string | null;
          duration: number | null;
          workout: { name: string } | null;
          exerciseLogs: { exercise: { name: string }; sets: { weight: number; reps: number }[] }[];
        }) => {
          const totalVolume = l.exerciseLogs.reduce((sum: number, el: { sets: SetEntry[] }) =>
            sum + el.sets.reduce((s: number, set: SetEntry) => s + set.weight * set.reps, 0), 0);
          return {
            id: l.id,
            name: l.workout?.name || "Workout",
            startedAt: l.startedAt,
            duration: l.duration,
            totalVolume: Math.round(totalVolume),
            exercises: l.exerciseLogs.map((el: { exercise: { name: string }; sets: SetEntry[] }) => ({
              name: el.exercise.name,
              sets: el.sets,
            })),
            completed: !!l.completedAt,
          };
        });
        setWorkouts(mapped);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = workouts.filter(w => {
    if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "week") {
      const monday = new Date();
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      monday.setHours(0, 0, 0, 0);
      return new Date(w.startedAt) >= monday;
    }
    if (filter === "month") {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      return new Date(w.startedAt) >= monthStart;
    }
    return true;
  });

  const grouped = groupByWeek(filtered);

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      <header className="px-5 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="text-neutral-400">←</button>
          <h1 className="text-xl font-bold">History</h1>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search workouts..."
          className="w-full bg-[#141414] border border-[#262626] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0066FF] mb-3"
        />
        <div className="flex gap-2">
          {(["all", "week", "month"] as FilterType[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${filter === f ? "bg-[#0066FF] text-white" : "bg-[#141414] text-neutral-400"}`}>
              {f === "all" ? "All Time" : f === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 px-6">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-lg font-bold mb-2">No workouts found</h2>
          <p className="text-neutral-500 text-sm">Complete your first workout to see it here</p>
        </div>
      ) : (
        <div className="px-5 space-y-6">
          {grouped.map(([weekKey, wks]) => (
            <div key={weekKey}>
              <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-3">
                Week of {new Date(weekKey + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                <span className="ml-2 text-neutral-700">({wks.length} workouts)</span>
              </p>
              <div className="space-y-2">
                {wks.map(w => (
                  <div key={w.id} className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setExpanded(expanded === w.id ? null : w.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          {w.completed && <span className="text-[#00C853] text-xs">✓</span>}
                          <p className="font-semibold text-sm">{w.name}</p>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {new Date(w.startedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          {w.duration ? ` · ${formatDuration(w.duration)}` : ""}
                          {w.totalVolume > 0 ? ` · ${(w.totalVolume / 1000).toFixed(1)}k lbs` : ""}
                        </p>
                      </div>
                      <span className="text-neutral-600 text-sm">{expanded === w.id ? "▲" : "▼"}</span>
                    </button>
                    {expanded === w.id && w.exercises.length > 0 && (
                      <div className="border-t border-[#1a1a1a] px-4 py-3 space-y-2">
                        {w.exercises.map((ex, i) => (
                          <div key={i}>
                            <p className="text-xs font-semibold text-neutral-300">{ex.name}</p>
                            <div className="flex gap-2 flex-wrap mt-1">
                              {ex.sets.map((s, j) => (
                                <span key={j} className="text-xs bg-[#0a0a0a] border border-[#262626] px-2 py-0.5 rounded-lg text-neutral-400">
                                  {s.weight}×{s.reps}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomNav active="profile" />
    </main>
  );
}
