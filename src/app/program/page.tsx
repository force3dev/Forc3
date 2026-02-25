"use client";
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const CARDIO_ICONS: Record<string, string> = { run: "🏃", bike: "🚴", swim: "🏊", row: "🚣", hike: "🥾", walk: "🚶", other: "⚡" };
const INTENSITY_COLORS: Record<string, string> = { low: "text-green-400", moderate: "text-yellow-400", high: "text-red-400", race: "text-purple-400" };

export default function ProgramPage() {
  const { data, isLoading } = useSWR("/api/user/program", fetcher);

  if (isLoading) return (
    <div className="min-h-dvh bg-black text-white px-5 pt-8">
      <h1 className="text-2xl font-black mb-6">My Program</h1>
      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-20 bg-[#141414] rounded-3xl animate-pulse" />
        ))}
      </div>
    </div>
  );

  const plan = data?.plan;
  const weekSchedule = data?.weekSchedule || [];

  return (
    <div className="min-h-dvh bg-black text-white pb-32">
      <div className="px-5 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black">My Program</h1>
            {plan && <p className="text-neutral-500 text-sm">{plan.name}</p>}
          </div>
          <Link
            href="/onboarding?regenerate=true"
            className="bg-[#141414] border border-[#262626] text-neutral-400 text-xs font-semibold px-3 py-2 rounded-xl"
          >
            Regenerate
          </Link>
        </div>

        {/* Week Schedule */}
        <h2 className="text-lg font-black mb-3">Weekly Schedule</h2>
        <div className="space-y-2">
          {weekSchedule.map((day: { dayName: string; workout: { id: string; name: string; focus: string; estimatedDuration: number; exercises: { name: string; sets: number; repsMin: number; repsMax: number }[] } | null; cardio: { id: string; type: string; title: string | null; duration: number | null; intensity: string | null } | null; isRestDay: boolean }) => {
            const isToday = new Date().toLocaleDateString("en-US", { weekday: "long" }) === day.dayName;

            return (
              <div
                key={day.dayName}
                className={`rounded-3xl overflow-hidden ${isToday ? "ring-1 ring-green-500/50" : ""}`}
              >
                {day.isRestDay ? (
                  <div className="bg-[#141414]/40 px-5 py-4 flex items-center gap-3">
                    <span className="text-neutral-600 font-bold text-sm w-10">{day.dayName.slice(0, 3).toUpperCase()}</span>
                    <span className="text-neutral-600 text-sm">😴 Rest Day</span>
                    {isToday && <span className="ml-auto text-green-400 text-xs font-bold">TODAY</span>}
                  </div>
                ) : (
                  <div className="bg-[#141414] px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span className={`font-bold text-sm w-10 mt-0.5 ${isToday ? "text-green-400" : "text-neutral-500"}`}>
                        {day.dayName.slice(0, 3).toUpperCase()}
                      </span>
                      <div className="flex-1 space-y-2">
                        {/* Strength workout */}
                        {day.workout && (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-sm">{day.workout.name}</p>
                              <p className="text-neutral-500 text-xs">
                                {day.workout.estimatedDuration}min · {day.workout.exercises.length} exercises
                              </p>
                            </div>
                            {isToday && (
                              <Link
                                href={`/workout/${day.workout.id}`}
                                className="bg-[#00C853] text-black text-xs font-bold px-3 py-1.5 rounded-xl"
                              >
                                Start
                              </Link>
                            )}
                          </div>
                        )}

                        {/* Cardio */}
                        {day.cardio && (
                          <div className={`flex items-center justify-between ${day.workout ? "pt-2 border-t border-[#262626]" : ""}`}>
                            <div>
                              <p className="font-bold text-sm">
                                {CARDIO_ICONS[day.cardio.type] || "⚡"} {day.cardio.title || day.cardio.type}
                              </p>
                              <p className={`text-xs ${INTENSITY_COLORS[day.cardio.intensity || "moderate"] || "text-neutral-500"}`}>
                                {day.cardio.duration}min · {day.cardio.intensity || "moderate"} intensity
                              </p>
                            </div>
                            {isToday && (
                              <Link
                                href="/cardio"
                                className="bg-[#0066FF]/20 border border-[#0066FF]/30 text-[#0066FF] text-xs font-bold px-3 py-1.5 rounded-xl"
                              >
                                Log
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                      {isToday && !day.workout && !day.cardio && (
                        <span className="ml-auto text-green-400 text-xs font-bold">TODAY</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* No program state */}
        {weekSchedule.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">📋</p>
            <h3 className="text-xl font-bold mb-2">No program yet</h3>
            <p className="text-neutral-400 mb-6">Complete onboarding to generate your AI training program</p>
            <Link href="/onboarding" className="bg-[#00C853] text-black font-bold px-8 py-4 rounded-2xl inline-block">
              Build My Program
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
