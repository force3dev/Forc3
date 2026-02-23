"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";

const CARDIO_TYPE_ICONS: Record<string, string> = {
  running: "🏃", cycling: "🚴", swimming: "🏊", hiit: "⚡",
  rowing: "🚣", jump_rope: "🪢", elliptical: "🔄", walking: "🚶",
  stair_climber: "🪜", sports: "⚽", run: "🏃", bike: "🚴",
  swim: "🏊", row: "🚣", sprint: "💨",
};

interface CardioActivityEntry {
  id: string;
  type: string;
  sport?: string | null;
  title?: string | null;
  description?: string | null;
  intensity?: string | null;
  duration: number;
  distance?: number | null;
  calories?: number | null;
  completedAt?: string | null;
  createdAt: string;
}

function formatDuration(secs: number) {
  if (secs < 120) return `${secs}s`;
  const m = Math.floor(secs / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function WorkoutCalendar() {
  const [workoutDates, setWorkoutDates] = useState<Set<string>>(new Set());
  const [cardioDates, setCardioDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/workouts/log?limit=200")
      .then(r => r.json())
      .then(d => {
        const dates = new Set<string>();
        for (const log of d.logs || []) {
          dates.add(new Date(log.startedAt).toISOString().slice(0, 10));
        }
        setWorkoutDates(dates);
      })
      .catch(() => {});

    fetch("/api/cardio/log")
      .then(r => r.json())
      .then(d => {
        const dates = new Set<string>();
        for (const a of d.activities || []) {
          const ts = a.completedAt || a.createdAt;
          if (ts) dates.add(new Date(ts).toISOString().slice(0, 10));
        }
        setCardioDates(dates);
      })
      .catch(() => {});
  }, []);

  // Build 12-week grid ending today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay(); // 0=Sun

  // Start from 12 weeks ago, adjusted to Sunday
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 83 - dayOfWeek); // ~12 weeks back from last Sunday

  const weeks: Date[][] = [];
  let cur = new Date(startDate);
  while (cur <= today) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      if (new Date(cur) <= today) week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    if (week.length) weeks.push(week);
  }

  const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
  const todayIso = today.toISOString().slice(0, 10);

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
      <h3 className="font-semibold text-sm mb-3 text-neutral-300">Training Activity</h3>
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-1">
            {DAY_LABELS.map((l, i) => (
              <div key={i} className="w-3 h-3 flex items-center justify-center">
                <span className="text-[8px] text-neutral-600">{i % 2 === 1 ? l : ""}</span>
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {Array.from({ length: 7 }, (_, di) => {
                const day = week[di];
                if (!day) return <div key={di} className="w-3 h-3" />;
                const iso = day.toISOString().slice(0, 10);
                const hasWorkout = workoutDates.has(iso);
                const hasCardio = cardioDates.has(iso);
                const isToday = iso === todayIso;
                let colorClass = "bg-[#1a1a1a]";
                let borderClass = "";
                if (hasWorkout && hasCardio) colorClass = "bg-[#7B4EFF]"; // both: purple
                else if (hasWorkout) colorClass = "bg-[#0066FF]"; // strength: blue
                else if (hasCardio) colorClass = "bg-[#00C853]"; // cardio: green
                else if (isToday) { colorClass = "bg-[#1a1a1a]"; borderClass = "border border-[#0066FF]/50"; }
                const label = [
                  iso,
                  hasWorkout ? "strength" : "",
                  hasCardio ? "cardio" : "",
                ].filter(Boolean).join(" — ");
                return (
                  <div
                    key={di}
                    className={`w-3 h-3 rounded-sm ${colorClass} ${borderClass}`}
                    title={label}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#1a1a1a]" />
          <span className="text-[10px] text-neutral-600">Rest</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#0066FF]" />
          <span className="text-[10px] text-neutral-600">Strength</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#00C853]" />
          <span className="text-[10px] text-neutral-600">Cardio</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#7B4EFF]" />
          <span className="text-[10px] text-neutral-600">Both</span>
        </div>
      </div>
    </div>
  );
}

// ─── Cardio Monthly Calendar ──────────────────────────────────────────────────

function CardioCalendar() {
  const [activities, setActivities] = useState<CardioActivityEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  useEffect(() => {
    fetch("/api/cardio/log")
      .then(r => r.json())
      .then(d => setActivities(d.activities || []))
      .catch(() => {});
  }, []);

  // Map iso date -> activities
  const byDate = activities.reduce<Record<string, CardioActivityEntry[]>>((acc, a) => {
    const ts = a.completedAt || a.createdAt;
    if (!ts) return acc;
    const iso = new Date(ts).toISOString().slice(0, 10);
    if (!acc[iso]) acc[iso] = [];
    acc[iso].push(a);
    return acc;
  }, {});

  const { year, month } = viewDate;
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  const prevMonth = () => setViewDate(v => {
    const d = new Date(v.year, v.month - 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const nextMonth = () => setViewDate(v => {
    const d = new Date(v.year, v.month + 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const selectedActivities = selectedDay ? (byDate[selectedDay] || []) : [];

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-neutral-300">Cardio Calendar</h3>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="text-neutral-500 hover:text-white px-1 text-sm">‹</button>
          <span className="text-xs font-semibold text-neutral-300 w-16 text-center">
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} className="text-neutral-500 hover:text-white px-1 text-sm">›</button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[9px] text-neutral-600 font-medium py-0.5">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const iso = new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
          const dayActivities = byDate[iso] || [];
          const hasCardio = dayActivities.length > 0;
          const isToday = iso === todayIso;
          const isSelected = iso === selectedDay;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(isSelected ? null : iso)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-colors ${
                isSelected
                  ? "bg-[#0066FF] text-white"
                  : isToday
                  ? "bg-[#0066FF]/20 border border-[#0066FF]/40 text-[#0066FF]"
                  : hasCardio
                  ? "bg-[#00C853]/15 hover:bg-[#00C853]/25 text-white"
                  : "hover:bg-[#1f1f1f] text-neutral-500"
              }`}
            >
              <span className="text-[10px] font-medium leading-none">{day}</span>
              {hasCardio && !isSelected && (
                <span className="text-[8px] mt-0.5 leading-none">
                  {CARDIO_TYPE_ICONS[dayActivities[0].type] || "🏃"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="mt-4 pt-4 border-t border-[#262626]">
          {selectedActivities.length === 0 ? (
            <p className="text-xs text-neutral-500 text-center">No cardio logged on this day</p>
          ) : (
            <div className="space-y-3">
              {selectedActivities.map(a => (
                <div key={a.id} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CARDIO_TYPE_ICONS[a.type] || "🏃"}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {a.title || (a.sport ? `${a.type} — ${a.sport}` : a.type)}
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        {formatDuration(a.duration)}
                        {a.distance ? ` · ${a.distance.toFixed(2)} mi` : ""}
                        {a.calories ? ` · ${Math.round(a.calories)} cal` : ""}
                        {a.intensity ? ` · ${a.intensity}` : ""}
                      </p>
                    </div>
                  </div>
                  {a.description && (
                    <div className="bg-[#0d0d0d] border border-[#262626] rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-[#00C853] mb-1 uppercase tracking-wide">Instructions</p>
                      <p className="text-xs text-neutral-400 leading-relaxed">{a.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Recent Cardio History ────────────────────────────────────────────────────

function CardioHistory() {
  const [activities, setActivities] = useState<CardioActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cardio/log")
      .then(r => r.json())
      .then(d => setActivities((d.activities || []).slice(0, 10)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="w-5 h-5 border-2 border-[#00C853] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 text-center">
        <div className="text-3xl mb-2">🏃</div>
        <p className="font-semibold text-sm">No cardio logged yet</p>
        <p className="text-xs text-neutral-500 mt-1">Complete a cardio session to see your history here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map(a => {
        const ts = a.completedAt || a.createdAt;
        const dateStr = ts
          ? new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "";
        const isOpen = expanded === a.id;
        return (
          <div key={a.id} className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
            <button
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#1a1a1a] transition-colors"
              onClick={() => setExpanded(isOpen ? null : a.id)}
            >
              <span className="text-2xl flex-shrink-0">{CARDIO_TYPE_ICONS[a.type] || "🏃"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {a.title || (a.sport ? `${a.type} — ${a.sport}` : a.type)}
                </p>
                <p className="text-[10px] text-neutral-500">
                  {dateStr} · {formatDuration(a.duration)}
                  {a.distance ? ` · ${a.distance.toFixed(2)} mi` : ""}
                  {a.calories ? ` · ${Math.round(a.calories)} cal` : ""}
                </p>
              </div>
              {a.intensity && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                  a.intensity === "easy" ? "bg-green-900/30 text-green-400"
                  : a.intensity === "moderate" ? "bg-yellow-900/30 text-yellow-400"
                  : a.intensity === "hard" ? "bg-orange-900/30 text-orange-400"
                  : "bg-red-900/30 text-red-400"
                }`}>
                  {a.intensity}
                </span>
              )}
              <span className="text-neutral-600 text-xs ml-1">{isOpen ? "▲" : "▼"}</span>
            </button>
            {isOpen && a.description && (
              <div className="px-4 pb-4">
                <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-[#00C853] mb-1.5 uppercase tracking-wide">Workout Instructions</p>
                  <p className="text-xs text-neutral-400 leading-relaxed">{a.description}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface PR {
  id: string;
  type: string;
  value: number;
  reps?: number;
  achievedAt: string;
  exercise: { name: string };
}

interface PRGroup {
  [exerciseName: string]: PR[];
}

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  unlocked: boolean;
}

export default function ProgressPage() {
  const router = useRouter();
  const [byExercise, setByExercise] = useState<PRGroup>({});
  const [workoutStats, setWorkoutStats] = useState<{
    totalWorkouts: number;
    totalVolume: number;
    totalSets: number;
    thisWeek: number;
    daysPerWeek: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalXP, setTotalXP] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [prRes, logRes, profileRes, achRes] = await Promise.all([
          fetch("/api/progress/prs"),
          fetch("/api/workouts/log?limit=100"),
          fetch("/api/user/profile"),
          fetch("/api/achievements"),
        ]);

        if (prRes.ok) {
          const prData = await prRes.json();
          setByExercise(prData.byExercise || {});
        }

        if (logRes.ok) {
          const logData = await logRes.json();
          const logs = logData.logs || [];

          const now = new Date();
          const monday = new Date(now);
          monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
          monday.setHours(0, 0, 0, 0);

          const thisWeek = logs.filter((l: { startedAt: string }) =>
            new Date(l.startedAt) >= monday
          ).length;

          let totalVolume = 0;
          let totalSets = 0;
          for (const log of logs) {
            for (const el of (log.exerciseLogs || [])) {
              for (const set of (el.sets || [])) {
                totalVolume += set.weight * set.reps;
                totalSets++;
              }
            }
          }

          setWorkoutStats({
            totalWorkouts: logs.length,
            totalVolume,
            totalSets,
            thisWeek,
            daysPerWeek: 4,
          });
        }

        if (profileRes.ok) {
          const profData = await profileRes.json();
          setStreak(profData.streak?.currentStreak || 0);
          if (workoutStats) {
            setWorkoutStats(prev => prev ? { ...prev, daysPerWeek: profData.profile?.trainingDays || 4 } : prev);
          }
        }

        if (achRes.ok) {
          const achData = await achRes.json();
          setAchievements(achData.achievements || []);
          setTotalXP(achData.totalXP || 0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exerciseNames = Object.keys(byExercise);

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      <header className="px-6 pt-8 pb-4">
        <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3</div>
        <h1 className="text-2xl font-bold mt-1">Progress</h1>
        <p className="text-sm text-neutral-500">Your performance data</p>
      </header>

      <div className="px-6 space-y-5">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
            <div className="text-xs text-neutral-500 uppercase tracking-wide">Streak</div>
            <div className="text-3xl font-bold mt-1 text-[#0066FF]">{streak}</div>
            <div className="text-xs text-neutral-500 mt-0.5">days {streak >= 7 ? "🔥" : ""}</div>
          </div>
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
            <div className="text-xs text-neutral-500 uppercase tracking-wide">Workouts</div>
            <div className="text-3xl font-bold mt-1">{workoutStats?.totalWorkouts || 0}</div>
            <div className="text-xs text-neutral-500 mt-0.5">total completed</div>
          </div>
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
            <div className="text-xs text-neutral-500 uppercase tracking-wide">Total Volume</div>
            <div className="text-2xl font-bold mt-1">
              {workoutStats?.totalVolume
                ? `${((workoutStats.totalVolume) / 1000).toFixed(1)}k`
                : "0"}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">lbs lifted</div>
          </div>
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
            <div className="text-xs text-neutral-500 uppercase tracking-wide">Total Sets</div>
            <div className="text-2xl font-bold mt-1">{workoutStats?.totalSets || 0}</div>
            <div className="text-xs text-neutral-500 mt-0.5">sets logged</div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => router.push("/progress/weekly")}
            className="bg-[#141414] border border-[#262626] rounded-2xl p-4 text-left hover:border-[#0066FF]/50 transition-colors"
          >
            <div className="text-2xl mb-2">📅</div>
            <div className="font-semibold text-sm">Weekly</div>
            <div className="text-xs text-neutral-500 mt-0.5">Report</div>
          </button>
          <button
            onClick={() => router.push("/progress/analytics")}
            className="bg-[#141414] border border-[#262626] rounded-2xl p-4 text-left hover:border-[#0066FF]/50 transition-colors"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="font-semibold text-sm">Analytics</div>
            <div className="text-xs text-neutral-500 mt-0.5">Trends</div>
          </button>
          <button
            onClick={() => router.push("/progress/measurements")}
            className="bg-[#141414] border border-[#262626] rounded-2xl p-4 text-left hover:border-[#0066FF]/50 transition-colors"
          >
            <div className="text-2xl mb-2">📏</div>
            <div className="font-semibold text-sm">Body</div>
            <div className="text-xs text-neutral-500 mt-0.5">Measurements</div>
          </button>
        </div>

        {/* Workout Calendar Heatmap */}
        <WorkoutCalendar />

        {/* Cardio Monthly Calendar */}
        <CardioCalendar />

        {/* Cardio History */}
        <div>
          <h2 className="text-lg font-bold mb-3">Cardio History</h2>
          <CardioHistory />
        </div>

        {/* Personal Records */}
        <div>
          <h2 className="text-lg font-bold mb-3">Personal Records</h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : exerciseNames.length === 0 ? (
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">🏆</div>
              <p className="font-semibold">No PRs yet</p>
              <p className="text-sm text-neutral-500 mt-1">
                Complete your first workout to start tracking personal records.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {exerciseNames.map(name => {
                const prs = byExercise[name];
                const best = prs[0]; // most recent (which is best since ordered by desc)
                return (
                  <div key={name} className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{name}</div>
                        <div className="text-xs text-neutral-500 mt-0.5">
                          {new Date(best.achievedAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <div className="text-[#FFB300] font-bold text-lg">
                          {Math.round(best.value)} lbs
                        </div>
                        <div className="text-xs text-neutral-500">
                          {best.type === "1rm" ? "Est. 1RM" : best.type.toUpperCase()}
                          {best.reps && ` @ ${best.reps} reps`}
                        </div>
                      </div>
                    </div>

                    {/* PR history */}
                    {prs.length > 1 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto">
                        {prs.slice(0, 6).map((pr, i) => (
                          <div
                            key={pr.id}
                            className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs ${
                              i === 0
                                ? "bg-[#FFB300]/20 text-[#FFB300] border border-[#FFB300]/30"
                                : "bg-[#0a0a0a] text-neutral-500 border border-[#262626]"
                            }`}
                          >
                            {Math.round(pr.value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Achievements</h3>
            <span className="text-xs text-[#FFB300] font-semibold">{totalXP} XP</span>
          </div>
          {achievements.length === 0 ? (
            <div className="text-center py-4 text-neutral-500 text-sm">Loading...</div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {achievements.slice(0, 8).map(a => (
                <div key={a.code} className="text-center">
                  <div
                    className={`text-3xl mb-1 ${!a.unlocked ? "grayscale opacity-25" : ""}`}
                    title={a.description}
                  >
                    {a.icon}
                  </div>
                  <div className="text-[10px] text-neutral-500 leading-tight">{a.name}</div>
                </div>
              ))}
            </div>
          )}
          {achievements.filter(a => a.unlocked).length > 0 && (
            <div className="mt-3 pt-3 border-t border-[#1a1a1a] text-xs text-neutral-500 text-center">
              {achievements.filter(a => a.unlocked).length}/{achievements.length} unlocked
            </div>
          )}
        </div>
      </div>

      <BottomNav active="profile" />
    </main>
  );
}
