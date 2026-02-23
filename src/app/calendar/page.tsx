"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";

type DayType = "strength" | "cardio" | "hybrid" | "rest" | "active_recovery";

type CalendarDay = {
  date: string;
  dayNumber: number;
  dayOfWeek: string;
  type: DayType;
  strength: {
    name: string;
    focus: string;
    exerciseCount: number;
    estimatedDuration: number;
    completed: boolean;
    workoutId?: string;
    logId?: string;
  } | null;
  cardio: {
    title: string;
    type: string;
    duration: number;
    intensity: string;
    completed: boolean;
    logId?: string;
  } | null;
  completed: boolean;
  isToday: boolean;
  isPast: boolean;
};

const CARDIO_ICONS: Record<string, string> = {
  running: "🏃",
  cycling: "🚴",
  swimming: "🏊",
  hiit: "⚡",
  rowing: "🚣",
  jump_rope: "🪢",
  walking: "🚶",
  run: "🏃",
  bike: "🚴",
  swim: "🏊",
};

const INTENSITY_COLOR: Record<string, string> = {
  easy: "#22c55e",
  moderate: "#f59e0b",
  hard: "#ef4444",
  max: "#a855f7",
};

function ringColor(day: CalendarDay): string {
  if (day.completed) return "#22c55e";
  if (day.isPast && day.type !== "rest" && day.type !== "active_recovery") return "#ef4444";
  if (day.isToday) return "#0066FF";
  return "transparent";
}

export default function CalendarPage() {
  const router = useRouter();
  const [view, setView] = useState<"week" | "month">("week");
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const fetchCalendar = useCallback(async (month: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar?month=${month}`);
      const data = await res.json();
      setDays(data.days || []);
    } catch {
      setDays([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendar(currentMonth);
  }, [currentMonth, fetchCalendar]);

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
  const weekDays = days.filter((d) => weekDates.includes(d.date));

  function prevMonth() {
    const [y, m] = currentMonth.split("-").map(Number);
    setCurrentMonth(m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`);
  }

  function nextMonth() {
    const [y, m] = currentMonth.split("-").map(Number);
    setCurrentMonth(m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`);
  }

  const monthLabel = new Date(`${currentMonth}-01`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const firstDayOfMonth = new Date(`${currentMonth}-01`).getDay();

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-xl font-bold">Training Calendar</h1>

        <div className="flex bg-[#141414] rounded-xl p-1 gap-1 mt-3">
          {(["week", "month"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-colors ${
                view === v ? "bg-[#0066FF] text-white" : "text-neutral-400"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {view === "month" && (
          <div className="flex items-center justify-between mt-4">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a1a] text-neutral-400">
              ←
            </button>
            <span className="font-semibold text-sm">{monthLabel}</span>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a1a] text-neutral-400">
              →
            </button>
          </div>
        )}
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : view === "week" ? (
        <WeekView days={weekDays} onSelect={setSelectedDay} />
      ) : (
        <MonthView days={days} firstDayOffset={firstDayOfMonth} onSelect={setSelectedDay} />
      )}

      {selectedDay && (
        <DayBottomSheet
          day={selectedDay}
          onClose={() => setSelectedDay(null)}
          onNavigate={(path) => {
            setSelectedDay(null);
            router.push(path);
          }}
        />
      )}

      <BottomNav active="workout" />
    </main>
  );
}

function WeekView({ days, onSelect }: { days: CalendarDay[]; onSelect: (d: CalendarDay) => void }) {
  return (
    <div className="px-4 grid grid-cols-7 gap-1.5">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
        <div key={d} className="text-center text-[10px] text-neutral-600 font-medium py-1">
          {d}
        </div>
      ))}
      {days.map((day) => (
        <button key={day.date} onClick={() => onSelect(day)} className="flex flex-col items-center gap-1 py-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold relative"
            style={{
              border: `2px solid ${ringColor(day)}`,
              background: day.isToday ? "#0066FF20" : "transparent",
              color: day.isToday ? "#0066FF" : "#fff",
            }}
          >
            {day.dayNumber}
          </div>
          <div className="flex flex-wrap justify-center gap-0.5">
            {day.strength && <span className="text-xs">💪</span>}
            {day.cardio && <span className="text-xs">{CARDIO_ICONS[day.cardio.type] || "🏃"}</span>}
            {day.type === "rest" && <span className="text-xs">😴</span>}
            {day.type === "active_recovery" && <span className="text-xs">🧘</span>}
          </div>
        </button>
      ))}
    </div>
  );
}

function MonthView({
  days,
  firstDayOffset,
  onSelect,
}: {
  days: CalendarDay[];
  firstDayOffset: number;
  onSelect: (d: CalendarDay) => void;
}) {
  return (
    <div className="px-4">
      <div className="grid grid-cols-7 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-neutral-600 font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {days.map((day) => (
          <button
            key={day.date}
            onClick={() => onSelect(day)}
            className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 relative transition-colors ${
              day.isToday ? "bg-[#0066FF20] border border-[#0066FF40]" : "hover:bg-[#1a1a1a]"
            }`}
          >
            <span className={`text-xs font-semibold ${day.isToday ? "text-[#0066FF]" : "text-white"}`}>{day.dayNumber}</span>
            <div className="flex gap-0.5">
              {day.strength && <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />}
              {day.cardio && <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />}
              {(day.type === "rest" || day.type === "active_recovery") && !day.strength && !day.cardio && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#6b7280]" />
              )}
            </div>
            {day.completed && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[#22c55e]" />}
          </button>
        ))}
      </div>

      <div className="flex gap-4 mt-4 px-2 justify-center">
        <span className="flex items-center gap-1 text-xs text-neutral-500">
          <span className="w-2 h-2 rounded-full bg-[#22c55e]" /> Strength
        </span>
        <span className="flex items-center gap-1 text-xs text-neutral-500">
          <span className="w-2 h-2 rounded-full bg-[#3b82f6]" /> Cardio
        </span>
        <span className="flex items-center gap-1 text-xs text-neutral-500">
          <span className="w-2 h-2 rounded-full bg-[#6b7280]" /> Rest
        </span>
      </div>
    </div>
  );
}

function DayBottomSheet({
  day,
  onClose,
  onNavigate,
}: {
  day: CalendarDay;
  onClose: () => void;
  onNavigate: (path: string) => void;
}) {
  const date = new Date(`${day.date}T12:00:00`);
  const dateLabel = date
    .toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
    .toUpperCase();
  const totalMin = (day.strength?.estimatedDuration || 0) + (day.cardio?.duration || 0);

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-40" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#141414] rounded-t-3xl p-6 pb-10 max-h-[80vh] overflow-y-auto">
        <div className="w-10 h-1 bg-[#333] rounded-full mx-auto mb-5" />
        <p className="text-xs text-neutral-500 font-semibold tracking-widest mb-4">{dateLabel}</p>

        {(day.type === "rest" || day.type === "active_recovery") && !day.strength && !day.cardio && (
          <div className="space-y-3">
            <div className="text-4xl text-center mb-2">{day.type === "rest" ? "😴" : "🧘"}</div>
            <h2 className="text-xl font-bold text-center">{day.type === "rest" ? "Rest Day" : "Active Recovery"}</h2>
            <p className="text-neutral-400 text-sm text-center leading-relaxed">
              {day.type === "rest"
                ? "Take it easy today. Your body gets stronger when it rests."
                : "Light movement only. Easy walk, stretching, or foam rolling."}
            </p>
            <div className="bg-[#1a1a1a] rounded-2xl p-4 mt-2">
              <p className="text-xs text-neutral-500 mb-2">Suggestions</p>
              <p className="text-sm text-neutral-300">Easy walk · Stretching · Foam rolling · Yoga</p>
            </div>
          </div>
        )}

        {day.strength && (
          <div className="bg-[#1a1a1a] rounded-2xl p-4 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">💪</span>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-widest">Strength</p>
                <p className="font-semibold">{day.strength.focus || day.strength.name}</p>
              </div>
              {day.strength.completed && <span className="ml-auto text-[#22c55e] text-xs font-semibold">✓ Done</span>}
            </div>
            <div className="flex gap-3 text-xs text-neutral-500 mb-3">
              {day.strength.exerciseCount > 0 && <span>{day.strength.exerciseCount} exercises</span>}
              <span>~{day.strength.estimatedDuration} min</span>
            </div>
            {day.strength.workoutId && (
              <button
                onClick={() => onNavigate(`/workout/${day.strength!.workoutId}`)}
                className="w-full py-2.5 bg-[#0066FF] rounded-xl text-sm font-semibold"
              >
                {day.strength.logId ? "View Workout →" : "Start Workout →"}
              </button>
            )}
          </div>
        )}

        {day.cardio && (
          <div className="bg-[#1a1a1a] rounded-2xl p-4 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{CARDIO_ICONS[day.cardio.type] || "🏃"}</span>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-widest">Cardio</p>
                <p className="font-semibold capitalize">{day.cardio.title}</p>
              </div>
              {day.cardio.completed && <span className="ml-auto text-[#22c55e] text-xs font-semibold">✓ Done</span>}
            </div>
            <div className="flex gap-3 text-xs mb-3">
              <span className="text-neutral-500">{day.cardio.duration} min</span>
              <span className="font-medium capitalize" style={{ color: INTENSITY_COLOR[day.cardio.intensity] || "#fff" }}>
                {day.cardio.intensity}
              </span>
            </div>
            <button
              onClick={() => onNavigate("/workout/cardio")}
              className="w-full py-2.5 bg-[#1a1a1a] border border-[#262626] rounded-xl text-sm font-medium text-neutral-300"
            >
              View Workout →
            </button>
          </div>
        )}

        {totalMin > 0 && (
          <div className="border-t border-[#262626] pt-3 mt-2">
            <p className="text-xs text-neutral-500 text-center">Total: ~{totalMin} min training today</p>
          </div>
        )}
      </div>
    </>
  );
}
