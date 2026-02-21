"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";

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
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/progress/weekly")}
            className="bg-[#141414] border border-[#262626] rounded-2xl p-4 text-left hover:border-[#0066FF]/50 transition-colors"
          >
            <div className="text-2xl mb-2">📅</div>
            <div className="font-semibold text-sm">Weekly Report</div>
            <div className="text-xs text-neutral-500 mt-0.5">Insights & recommendations</div>
          </button>
          <button
            onClick={() => router.push("/progress/analytics")}
            className="bg-[#141414] border border-[#262626] rounded-2xl p-4 text-left hover:border-[#0066FF]/50 transition-colors"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="font-semibold text-sm">Analytics</div>
            <div className="text-xs text-neutral-500 mt-0.5">Volume & strength trends</div>
          </button>
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

      <BottomNav active="progress" />
    </main>
  );
}
