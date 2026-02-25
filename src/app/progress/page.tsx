"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";
import ProgressPhotoUpload from "@/components/ProgressPhotoUpload";
import ProgressPhotoGallery from "@/components/ProgressPhotoGallery";
import VolumeLandmarks from "@/components/VolumeLandmarks";
import { getLevelFromXP, getXPProgressPercent, getNextLevel } from "@/lib/xp-system";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface WorkoutStats {
  totalWorkouts: number;
  totalVolume: number;
  totalSets: number;
  thisWeek: number;
  daysPerWeek: number;
}

interface CardioLog {
  id: string;
  type: string;
  duration: number;
  distance?: number;
  calories?: number;
  date: string;
}

interface Measurement {
  id: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  thighs?: number;
}

// ─── Heatmap Calendar ─────────────────────────────────────────────────────────

function WorkoutCalendar() {
  const [workoutDates, setWorkoutDates] = useState<Set<string>>(new Set());

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
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 83 - dayOfWeek);

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

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
      <h3 className="font-semibold text-sm mb-3 text-neutral-300">Workout Activity</h3>
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
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
                const isToday = iso === today.toISOString().slice(0, 10);
                return (
                  <div
                    key={di}
                    className={`w-3 h-3 rounded-sm ${
                      hasWorkout ? "bg-[#0066FF]" : isToday ? "bg-[#1a1a1a] border border-[#0066FF]/50" : "bg-[#1a1a1a]"
                    }`}
                    title={`${iso}${hasWorkout ? " — workout" : ""}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <div className="w-3 h-3 rounded-sm bg-[#1a1a1a]" />
        <span className="text-[10px] text-neutral-600">Rest</span>
        <div className="w-3 h-3 rounded-sm bg-[#0066FF] ml-2" />
        <span className="text-[10px] text-neutral-600">Workout</span>
      </div>
    </div>
  );
}

// ─── Strength Tab ─────────────────────────────────────────────────────────────

function StrengthTab({ stats, byExercise, loading }: { stats: WorkoutStats | null; byExercise: PRGroup; loading: boolean }) {
  const router = useRouter();
  const exerciseNames = Object.keys(byExercise);

  return (
    <div className="space-y-5">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Total Workouts", value: stats?.totalWorkouts || 0, sub: "completed" },
          { label: "Total Sets", value: stats?.totalSets || 0, sub: "logged" },
          {
            label: "Volume Lifted",
            value: stats?.totalVolume ? `${((stats.totalVolume) / 1000).toFixed(1)}k` : "0",
            sub: "lbs total",
          },
          { label: "This Week", value: stats?.thisWeek || 0, sub: "workouts" },
        ].map(s => (
          <div key={s.label} className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
            <div className="text-xs text-neutral-500 uppercase tracking-wide">{s.label}</div>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
            <div className="text-xs text-neutral-500 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: "📅", label: "Weekly", sub: "Report", href: "/progress/weekly" },
          { icon: "📊", label: "Analytics", sub: "Trends", href: "/progress/analytics" },
          { icon: "📏", label: "Body", sub: "Measurements", href: "/progress/measurements" },
        ].map(l => (
          <button key={l.href} onClick={() => router.push(l.href)}
            className="bg-[#141414] border border-[#262626] rounded-2xl p-4 text-left hover:border-[#0066FF]/50 transition-colors">
            <div className="text-2xl mb-2">{l.icon}</div>
            <div className="font-semibold text-sm">{l.label}</div>
            <div className="text-xs text-neutral-500 mt-0.5">{l.sub}</div>
          </button>
        ))}
      </div>

      <WorkoutCalendar />
      <VolumeLandmarks />

      {/* PRs */}
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
            <p className="text-sm text-neutral-500 mt-1">Complete your first workout to start tracking PRs.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exerciseNames.map(name => {
              const prs = byExercise[name];
              const best = prs[0];
              return (
                <div key={name} className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{name}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {new Date(best.achievedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <div className="text-[#FFB300] font-bold text-lg">{Math.round(best.value)} lbs</div>
                      <div className="text-xs text-neutral-500">
                        {best.type === "1rm" ? "Est. 1RM" : best.type.toUpperCase()}
                        {best.reps && ` @ ${best.reps} reps`}
                      </div>
                    </div>
                  </div>
                  {prs.length > 1 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      {prs.slice(0, 6).map((pr, i) => (
                        <div key={pr.id} className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs ${
                          i === 0 ? "bg-[#FFB300]/20 text-[#FFB300] border border-[#FFB300]/30" : "bg-[#0a0a0a] text-neutral-500 border border-[#262626]"
                        }`}>
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
    </div>
  );
}

// ─── Cardio Tab ───────────────────────────────────────────────────────────────

function CardioTab() {
  const [logs, setLogs] = useState<CardioLog[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/cardio/today?limit=30")
      .then(r => r.json())
      .then(d => setLogs(d.sessions || d.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalMinutes = logs.reduce((s, l) => s + (l.duration || 0), 0);
  const totalDistance = logs.reduce((s, l) => s + (l.distance || 0), 0);
  const totalCalories = logs.reduce((s, l) => s + (l.calories || 0), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Sessions", value: logs.length, sub: "logged" },
          { label: "Time", value: `${Math.round(totalMinutes)}`, sub: "minutes" },
          { label: "Calories", value: Math.round(totalCalories), sub: "burned" },
        ].map(s => (
          <div key={s.label} className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
            <div className="text-xs text-neutral-500 uppercase tracking-wide">{s.label}</div>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
            <div className="text-xs text-neutral-500 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {totalDistance > 0 && (
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 flex items-center justify-between">
          <span className="text-sm text-neutral-400">Total Distance</span>
          <span className="font-bold">{totalDistance.toFixed(1)} mi</span>
        </div>
      )}

      <button
        onClick={() => router.push("/workout/cardio")}
        className="w-full py-3.5 bg-[#0066FF] text-white font-bold rounded-2xl"
      >
        + Log Cardio Session
      </button>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">🏃</div>
          <p className="font-semibold">No cardio logged yet</p>
          <p className="text-sm text-neutral-500 mt-1">Start your first session above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log.id} className="bg-[#141414] border border-[#262626] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm capitalize">{log.type.replace(/_/g, " ")}</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  {new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">{log.duration} min</div>
                {log.distance && <div className="text-xs text-neutral-500">{log.distance} mi</div>}
                {log.calories && <div className="text-xs text-[#00C853]">{log.calories} kcal</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Body Tab ─────────────────────────────────────────────────────────────────

function BodyTab({ galleryKey, onGalleryRefresh }: { galleryKey: number; onGalleryRefresh: () => void }) {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/progress/measurements")
      .then(r => r.json())
      .then(d => setMeasurements(d.measurements || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const latest = measurements[0];

  return (
    <div className="space-y-5">
      {/* Latest measurements */}
      {latest && (
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">Latest Measurements</h3>
            <span className="text-xs text-neutral-500">
              {new Date(latest.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Weight", value: latest.weight ? `${latest.weight} kg` : null },
              { label: "Body Fat", value: latest.bodyFat ? `${latest.bodyFat}%` : null },
              { label: "Waist", value: latest.waist ? `${latest.waist} cm` : null },
              { label: "Arms", value: latest.arms ? `${latest.arms} cm` : null },
            ].filter(m => m.value).map(m => (
              <div key={m.label} className="bg-[#0a0a0a] rounded-xl p-3">
                <div className="text-xs text-neutral-500">{m.label}</div>
                <div className="font-bold mt-0.5">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => router.push("/progress/measurements")}
        className="w-full py-3.5 bg-[#141414] border border-[#262626] text-white font-bold rounded-2xl hover:border-[#0066FF]/50 transition-colors"
      >
        📏 Log Measurements →
      </button>

      {/* Progress Photos */}
      <div>
        <h3 className="font-bold text-sm mb-3">Progress Photos</h3>
        <ProgressPhotoUpload onUploaded={onGalleryRefresh} />
        <div className="mt-3">
          <ProgressPhotoGallery key={galleryKey} />
        </div>
      </div>

      {loading && measurements.length === 0 && (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// ─── Habits Tab ───────────────────────────────────────────────────────────────

function HabitsTab({ streak, stats }: { streak: number; stats: WorkoutStats | null }) {
  const milestones = [7, 14, 30, 60, 100];

  return (
    <div className="space-y-5">
      {/* Streak card */}
      <div className="bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20 rounded-2xl p-5 text-center">
        <div className="text-5xl font-black text-orange-400">{streak}</div>
        <div className="text-lg font-bold mt-1">Day Streak 🔥</div>
        <p className="text-sm text-neutral-400 mt-1">Keep it going — don't break the chain</p>
      </div>

      {/* Milestone progress */}
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
        <h3 className="font-bold text-sm mb-4">Streak Milestones</h3>
        <div className="space-y-3">
          {milestones.map(m => {
            const reached = streak >= m;
            const pct = Math.min(100, (streak / m) * 100);
            return (
              <div key={m} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                  reached ? "bg-orange-500 text-white" : "bg-[#1a1a1a] text-neutral-600"
                }`}>
                  {reached ? "✓" : m}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className={reached ? "text-orange-400 font-semibold" : "text-neutral-500"}>
                      {m}-Day Streak
                    </span>
                    {!reached && <span className="text-neutral-600">{streak}/{m}</span>}
                  </div>
                  <div className="h-1.5 bg-[#262626] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${reached ? "bg-orange-500" : "bg-[#0066FF]"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Consistency stats */}
      {stats && (
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
          <h3 className="font-bold text-sm mb-4">Consistency</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0a0a0a] rounded-xl p-3">
              <div className="text-xs text-neutral-500">This Week</div>
              <div className="text-2xl font-bold mt-1 text-[#0066FF]">{stats.thisWeek}</div>
              <div className="text-xs text-neutral-500">of {stats.daysPerWeek} days</div>
            </div>
            <div className="bg-[#0a0a0a] rounded-xl p-3">
              <div className="text-xs text-neutral-500">Total</div>
              <div className="text-2xl font-bold mt-1">{stats.totalWorkouts}</div>
              <div className="text-xs text-neutral-500">workouts</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Achievements Tab ─────────────────────────────────────────────────────────

function AchievementsTab({ achievements, totalXP, loading }: { achievements: Achievement[]; totalXP: number; loading: boolean }) {
  const currentLevel = getLevelFromXP(totalXP);
  const xpPct = getXPProgressPercent(totalXP);
  const nextLevel = getNextLevel(totalXP);

  const unlocked = achievements.filter(a => a.unlocked);
  const locked = achievements.filter(a => !a.unlocked);

  const categories = Array.from(new Set(achievements.map(a => a.category)));

  return (
    <div className="space-y-5">
      {/* XP / Level card */}
      <div className="bg-gradient-to-br from-[#0066FF]/10 to-[#003399]/5 border border-[#0066FF]/20 rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#0066FF] flex items-center justify-center text-xl font-black">
            {currentLevel.level}
          </div>
          <div className="flex-1">
            <div className="font-black text-lg">{currentLevel.name}</div>
            <div className="text-sm text-neutral-400">Level {currentLevel.level}</div>
            <div className="mt-2 h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
              <div className="h-full bg-[#0066FF] rounded-full transition-all" style={{ width: `${xpPct}%` }} />
            </div>
            {nextLevel && (
              <div className="text-xs text-neutral-500 mt-1">{totalXP.toLocaleString()} / {nextLevel.minXP.toLocaleString()} XP</div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 flex items-center justify-between">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#FFD700]">{unlocked.length}</div>
          <div className="text-xs text-neutral-500">Unlocked</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{achievements.length}</div>
          <div className="text-xs text-neutral-500">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[#0066FF]">{totalXP.toLocaleString()}</div>
          <div className="text-xs text-neutral-500">XP Earned</div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Unlocked */}
          {unlocked.length > 0 && (
            <div>
              <h3 className="font-bold text-sm mb-3 text-[#FFD700]">Unlocked ({unlocked.length})</h3>
              <div className="grid grid-cols-2 gap-3">
                {unlocked.map(a => (
                  <div key={a.code} className="bg-[#141414] border border-[#FFD700]/20 rounded-2xl p-4">
                    <div className="text-3xl mb-2">{a.icon}</div>
                    <div className="font-semibold text-sm">{a.name}</div>
                    <div className="text-xs text-neutral-500 mt-0.5 leading-snug">{a.description}</div>
                    <div className="text-xs text-[#FFD700] mt-2 font-semibold">+{a.xpReward} XP</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locked */}
          {locked.length > 0 && (
            <div>
              <h3 className="font-bold text-sm mb-3 text-neutral-500">Locked ({locked.length})</h3>
              <div className="grid grid-cols-2 gap-3">
                {locked.map(a => (
                  <div key={a.code} className="bg-[#141414] border border-[#262626] rounded-2xl p-4 opacity-50">
                    <div className="text-3xl mb-2 grayscale">{a.icon}</div>
                    <div className="font-semibold text-sm">{a.name}</div>
                    <div className="text-xs text-neutral-600 mt-0.5 leading-snug">{a.description}</div>
                    <div className="text-xs text-neutral-600 mt-2">+{a.xpReward} XP</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type ProgressTab = "strength" | "cardio" | "body" | "habits" | "achievements";

export default function ProgressPage() {
  const [tab, setTab] = useState<ProgressTab>("strength");
  const [galleryKey, setGalleryKey] = useState(0);
  const [byExercise, setByExercise] = useState<PRGroup>({});
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalXP, setTotalXP] = useState(0);

  const load = useCallback(async () => {
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
        const thisWeek = logs.filter((l: { startedAt: string }) => new Date(l.startedAt) >= monday).length;
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
        setWorkoutStats({ totalWorkouts: logs.length, totalVolume, totalSets, thisWeek, daysPerWeek: 4 });
      }

      if (profileRes.ok) {
        const profData = await profileRes.json();
        setStreak(profData.streak?.currentStreak || 0);
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
  }, []);

  useEffect(() => { load(); }, [load]);

  const tabs: { id: ProgressTab; label: string; icon: string }[] = [
    { id: "strength", label: "Strength", icon: "💪" },
    { id: "cardio", label: "Cardio", icon: "🏃" },
    { id: "body", label: "Body", icon: "📸" },
    { id: "habits", label: "Habits", icon: "🔥" },
    { id: "achievements", label: "Trophies", icon: "🏆" },
  ];

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      <header className="px-6 pt-8 pb-4">
        <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3</div>
        <h1 className="text-2xl font-bold mt-1">Progress</h1>
        <p className="text-sm text-neutral-500">Your performance data</p>
      </header>

      {/* Scrollable tab bar */}
      <div className="px-6 mb-5">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t.id
                  ? "bg-[#0066FF] text-white"
                  : "bg-[#141414] border border-[#262626] text-neutral-400"
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-6">
        {tab === "strength" && (
          <StrengthTab stats={workoutStats} byExercise={byExercise} loading={loading} />
        )}
        {tab === "cardio" && <CardioTab />}
        {tab === "body" && (
          <BodyTab galleryKey={galleryKey} onGalleryRefresh={() => setGalleryKey(k => k + 1)} />
        )}
        {tab === "habits" && <HabitsTab streak={streak} stats={workoutStats} />}
        {tab === "achievements" && (
          <AchievementsTab achievements={achievements} totalXP={totalXP} loading={loading} />
        )}
      </div>

      <BottomNav active="profile" />
    </main>
  );
}
