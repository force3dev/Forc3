"use client";
import { useState } from "react";
import useSWR from "swr";
import { format, addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { haptics } from "@/lib/haptics";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import BottomNav from "@/components/shared/BottomNav";

const fetcher = (url: string) => fetch(url).then(r => r.json());

type ViewMode = "week" | "month";

const CARDIO_ICONS: Record<string, string> = {
  run: "🏃", bike: "🚴", swim: "🏊", row: "🚣", hike: "🥾",
  walk: "🚶", hiit: "⚡", sprint: "💨", default: "🏋️",
};

export default function CalendarPage() {
  const [view, setView] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data, isLoading } = useSWR(
    `/api/calendar?view=${view}&date=${currentDate.toISOString()}`,
    fetcher,
    { revalidateOnFocus: true }
  );

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => navigate("forward"),
    onSwipeRight: () => navigate("back"),
  });

  function navigate(dir: "forward" | "back") {
    haptics.light();
    if (view === "week") {
      setCurrentDate(dir === "forward" ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(dir === "forward" ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    }
  }

  const selectedDayData = data?.days?.find((d: any) => d.date === selectedDate);
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="min-h-dvh bg-black text-white pb-24">
      {/* Header */}
      <div className="px-5 pt-8 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black">
            {view === "week"
              ? `Week of ${format(currentDate, "MMM d")}`
              : format(currentDate, "MMMM yyyy")
            }
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setCurrentDate(new Date()); setSelectedDate(today); haptics.light(); }}
              className="text-[#00C853] text-sm font-semibold px-3 py-1.5 rounded-xl bg-[#00C853]/10"
            >
              Today
            </button>
            <div className="flex bg-[#141414] rounded-xl p-1">
              {(["week", "month"] as ViewMode[]).map(v => (
                <button
                  key={v}
                  onClick={() => { setView(v); haptics.light(); }}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    view === v ? "bg-white text-black" : "text-neutral-400"
                  }`}
                >
                  {v === "week" ? "W" : "M"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("back")} className="p-2 text-neutral-400 active:scale-90 transition-transform">
            ←
          </button>
          <div className="flex-1" />
          <button onClick={() => navigate("forward")} className="p-2 text-neutral-400 active:scale-90 transition-transform">
            →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div {...swipeHandlers} className="px-5">
        {view === "week" ? (
          <div className="flex gap-2 mb-6">
            {isLoading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 h-20 bg-[#141414] rounded-2xl animate-pulse" />
              ))
            ) : (
              data?.days?.map((day: any) => {
                const isSelected = day.date === selectedDate;
                return (
                  <button
                    key={day.date}
                    onClick={() => { setSelectedDate(day.date); haptics.light(); }}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl transition-all active:scale-95 ${
                      isSelected ? "bg-white text-black" : "bg-[#141414]"
                    }`}
                  >
                    <span className={`text-[11px] font-medium ${isSelected ? "text-black/60" : "text-neutral-500"}`}>
                      {day.dayShort?.toUpperCase()}
                    </span>
                    <span className={`text-lg font-black ${
                      isSelected ? "text-black" : day.isToday ? "text-[#00C853]" : "text-white"
                    }`}>
                      {day.dayNumber}
                    </span>
                    <div className="flex gap-0.5 items-center">
                      {day.workout && (
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          day.status === "completed" ? "bg-[#00C853]" :
                          day.status === "missed" ? "bg-red-500" :
                          day.isToday ? "bg-white" : "bg-neutral-600"
                        }`} />
                      )}
                      {day.cardio && (
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          day.cardioLog ? "bg-blue-400" :
                          day.status === "missed" ? "bg-red-500/50" :
                          day.isToday ? "bg-white/60" : "bg-neutral-700"
                        }`} />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div className="mb-6">
            <div className="grid grid-cols-7 mb-2">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div key={i} className="text-center text-neutral-600 text-xs font-medium py-1">{d}</div>
              ))}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-[#141414] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {data?.days?.map((day: any) => {
                  const isSelected = day.date === selectedDate;
                  return (
                    <button
                      key={day.date}
                      onClick={() => { setSelectedDate(day.date); haptics.light(); }}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-90 ${
                        isSelected ? "bg-white" :
                        day.isToday ? "ring-1 ring-[#00C853]" :
                        "bg-[#141414]/40"
                      }`}
                    >
                      <span className={`text-sm font-bold ${
                        isSelected ? "text-black" :
                        day.isToday ? "text-[#00C853]" :
                        day.isPast ? "text-neutral-400" : "text-white"
                      }`}>
                        {day.dayNumber}
                      </span>
                      <div className="flex gap-0.5 mt-0.5">
                        {day.workout && (
                          <div className={`w-1 h-1 rounded-full ${
                            day.workoutLog ? "bg-[#00C853]" :
                            day.status === "missed" ? "bg-red-500" :
                            "bg-neutral-600"
                          }`} />
                        )}
                        {day.cardio && (
                          <div className={`w-1 h-1 rounded-full ${
                            day.cardioLog ? "bg-blue-400" :
                            day.status === "missed" ? "bg-red-500/50" :
                            "bg-neutral-700"
                          }`} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Selected Day Detail */}
        <AnimatePresence mode="wait">
          {selectedDayData && (
            <motion.div
              key={selectedDate}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black">
                    {selectedDayData.isToday ? "Today" : `${selectedDayData.dayName}, ${selectedDayData.month} ${selectedDayData.dayNumber}`}
                  </h2>
                  {selectedDayData.checkIn && (
                    <p className="text-neutral-500 text-sm">
                      Recovery: {selectedDayData.checkIn.recoveryScore}/100 · Sleep: {selectedDayData.checkIn.sleepHours}h
                    </p>
                  )}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedDayData.status === "completed" ? "bg-[#00C853]/20 text-[#00C853]" :
                  selectedDayData.status === "missed" ? "bg-red-500/20 text-red-400" :
                  selectedDayData.status === "today" ? "bg-white/10 text-white" :
                  selectedDayData.status === "rest" ? "bg-neutral-800 text-neutral-500" :
                  "bg-neutral-800 text-neutral-400"
                }`}>
                  {selectedDayData.status === "completed" ? "✓ Completed" :
                   selectedDayData.status === "missed" ? "✗ Missed" :
                   selectedDayData.status === "today" ? "• Today" :
                   selectedDayData.status === "rest" ? "😴 Rest" :
                   "Upcoming"}
                </div>
              </div>

              {/* REST DAY */}
              {selectedDayData.status === "rest" && (
                <div className="bg-[#141414] rounded-3xl p-6">
                  <div className="text-center mb-5">
                    <div className="text-4xl mb-3">😴</div>
                    <h3 className="font-bold text-lg mb-2">Rest Day</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      Recovery is training. Your muscles grow on days like today.
                    </p>
                  </div>
                  <p className="text-neutral-500 text-xs uppercase tracking-wider mb-3">Active Recovery Options</p>
                  <div className="space-y-2">
                    {[
                      { name: '20-min Walk', emoji: '🚶', duration: 20, description: 'Easy zone 1, promotes blood flow' },
                      { name: 'Yoga Flow', emoji: '🧘', duration: 30, description: 'Hip flexors, hamstrings, thoracic' },
                      { name: 'Foam Rolling', emoji: '🔵', duration: 15, description: 'Focus on areas from last training' },
                      { name: 'Cold/Hot Contrast', emoji: '🧊', duration: 10, description: 'Reduce inflammation' },
                      { name: 'Mobility Work', emoji: '🤸', duration: 20, description: 'Joint health and range of motion' },
                    ].map(opt => (
                      <button
                        key={opt.name}
                        onClick={() => {
                          haptics.light();
                          fetch('/api/cardio/log', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'recovery', title: opt.name, duration: opt.duration, date: selectedDate })
                          });
                        }}
                        className="w-full flex items-center gap-3 bg-neutral-900 rounded-2xl p-3 text-left active:scale-[0.98] transition-transform"
                      >
                        <span className="text-2xl">{opt.emoji}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{opt.name}</p>
                          <p className="text-neutral-500 text-xs">{opt.description}</p>
                        </div>
                        <span className="text-neutral-600 text-xs">{opt.duration}m</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STRENGTH WORKOUT */}
              {selectedDayData.workout && (
                <div className={`rounded-3xl p-5 mb-3 ${
                  selectedDayData.workoutLog ? "bg-[#002211] border border-[#00C853]/20" : "bg-[#141414]"
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">💪</span>
                        <span className="text-xs text-neutral-500 uppercase tracking-wider">Strength</span>
                        {selectedDayData.workoutLog && <span className="text-xs text-[#00C853]">✓ Done</span>}
                      </div>
                      <h3 className="font-black text-lg">{selectedDayData.workout.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-neutral-500 text-xs">{selectedDayData.workout.estimatedDuration} min</p>
                      <p className="text-neutral-500 text-xs">{selectedDayData.workout.exerciseCount} exercises</p>
                    </div>
                  </div>

                  {selectedDayData.workoutLog && (
                    <div className="flex gap-4 mb-4 pt-3 border-t border-[#00C853]/20">
                      <div>
                        <p className="text-[#00C853] font-bold">{selectedDayData.workoutLog.duration || "—"}m</p>
                        <p className="text-neutral-500 text-xs">Duration</p>
                      </div>
                      <div>
                        <p className="text-[#00C853] font-bold">{(selectedDayData.workoutLog.totalVolume || 0).toLocaleString()}</p>
                        <p className="text-neutral-500 text-xs">Lbs lifted</p>
                      </div>
                      <div>
                        <p className="text-[#00C853] font-bold">{selectedDayData.workoutLog.exerciseCount}</p>
                        <p className="text-neutral-500 text-xs">Exercises</p>
                      </div>
                    </div>
                  )}

                  {!selectedDayData.workoutLog && (selectedDayData.isToday || selectedDayData.isFuture) && (
                    <Link
                      href={`/workout/active/${selectedDayData.workout.id}`}
                      className="block w-full bg-[#00C853] text-black font-bold text-center py-3 rounded-2xl active:scale-95 transition-transform"
                    >
                      Start Workout →
                    </Link>
                  )}
                  {selectedDayData.workoutLog && (
                    <Link href={`/workout/${selectedDayData.workoutLog.id}`} className="block text-center text-[#00C853] text-sm font-semibold py-2">
                      View Details →
                    </Link>
                  )}
                </div>
              )}

              {/* CARDIO */}
              {selectedDayData.cardio && (
                <div className={`rounded-3xl p-5 mb-3 ${
                  selectedDayData.cardioLog ? "bg-blue-950/30 border border-blue-900/50" : "bg-[#141414]"
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{CARDIO_ICONS[selectedDayData.cardio.type] || "⚡"}</span>
                        <span className="text-xs text-neutral-500 uppercase tracking-wider">Cardio</span>
                        {selectedDayData.cardioLog && <span className="text-xs text-blue-400">✓ Done</span>}
                      </div>
                      <h3 className="font-black text-lg">{selectedDayData.cardio.title}</h3>
                      <p className="text-neutral-400 text-sm capitalize">{selectedDayData.cardio.intensity} intensity</p>
                    </div>
                    <p className="text-neutral-500 text-sm">{selectedDayData.cardio.duration} min</p>
                  </div>

                  {selectedDayData.cardioLog && (
                    <div className="flex gap-4 pt-3 border-t border-blue-900/30 mb-4">
                      {selectedDayData.cardioLog.distance && (
                        <div>
                          <p className="text-blue-400 font-bold">{selectedDayData.cardioLog.distance.toFixed(1)} km</p>
                          <p className="text-neutral-500 text-xs">Distance</p>
                        </div>
                      )}
                      {selectedDayData.cardioLog.duration && (
                        <div>
                          <p className="text-blue-400 font-bold">{selectedDayData.cardioLog.duration}m</p>
                          <p className="text-neutral-500 text-xs">Duration</p>
                        </div>
                      )}
                    </div>
                  )}

                  {!selectedDayData.cardioLog && (selectedDayData.isToday || selectedDayData.isFuture) && (
                    <Link href="/workout/cardio" className="block w-full bg-blue-500 text-white font-bold text-center py-3 rounded-2xl active:scale-95 transition-transform">
                      Log Cardio →
                    </Link>
                  )}
                </div>
              )}

              {/* NUTRITION SUMMARY */}
              {selectedDayData.nutrition && (
                <div className="bg-[#141414] rounded-3xl p-5 mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Nutrition</p>
                      <p className="font-black text-lg">{selectedDayData.nutrition.calories} <span className="text-neutral-500 font-normal text-sm">cal</span></p>
                      <p className="text-neutral-400 text-sm">{selectedDayData.nutrition.protein}g protein</p>
                    </div>
                    <Link href={`/nutrition?date=${selectedDate}`} className="text-[#00C853] text-sm font-semibold">
                      View →
                    </Link>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!selectedDayData.workout && !selectedDayData.cardio && selectedDayData.status !== "rest" && (
                <div className="bg-[#141414] rounded-3xl p-6 text-center">
                  <p className="text-neutral-500">Nothing scheduled for this day.</p>
                  <Link href="/coach" className="text-[#00C853] text-sm mt-2 block">Ask coach to add something →</Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Week summary */}
        {data?.summary && view === "week" && (
          <div className="mt-6 bg-[#141414] rounded-3xl p-4">
            <div className="flex justify-between text-center">
              <div>
                <p className="text-white font-black text-xl">{data.summary.completedWorkouts}</p>
                <p className="text-neutral-500 text-xs">Done</p>
              </div>
              <div>
                <p className="text-white font-black text-xl">{data.summary.plannedWorkouts}</p>
                <p className="text-neutral-500 text-xs">Planned</p>
              </div>
              <div>
                <p className="text-red-400 font-black text-xl">{data.summary.missedWorkouts}</p>
                <p className="text-neutral-500 text-xs">Missed</p>
              </div>
              <div>
                <p className="text-[#00C853] font-black text-xl">{data.summary.completionRate}%</p>
                <p className="text-neutral-500 text-xs">Rate</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav active="home" />
    </div>
  );
}
