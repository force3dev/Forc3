"use client";
import { useState, useEffect, useCallback } from "react";
import { CARDIO_TYPE_ICONS, INTENSITY_COLORS } from "@/lib/cardio-templates";

interface CalendarDay {
  date: string;
  dayOfWeek: number;
  isToday: boolean;
  isPast: boolean;
  activity: {
    id: string;
    type: string;
    title: string | null;
    intensity: string | null;
    duration: number;
    completed: boolean;
  } | null;
  suggestion: {
    templateId: string;
    type: string;
    title: string;
    intensity: string;
    duration: number;
  } | null;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function CardioCalendar() {
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback((offset: number) => {
    setLoading(true);
    fetch(`/api/cardio/calendar?offset=${offset}`)
      .then((r) => r.json())
      .then((data) => {
        setDays(data.days || []);
        // Auto-select today if on the current week
        if (offset === 0) {
          const today = data.days?.find((d: CalendarDay) => d.isToday);
          if (today) setSelected(today.date);
        }
      })
      .catch(() => setDays([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(weekOffset);
  }, [weekOffset, load]);

  const selectedDay = days.find((d) => d.date === selected) || null;
  const current = selectedDay?.activity || selectedDay?.suggestion || null;
  const isActivity = !!selectedDay?.activity;
  const intensityKey = isActivity
    ? selectedDay!.activity!.intensity || "moderate"
    : (selectedDay?.suggestion?.intensity ?? "moderate");
  const intensityClass = INTENSITY_COLORS[intensityKey] || INTENSITY_COLORS.moderate;
  const icon = current ? CARDIO_TYPE_ICONS[current.type] || "🏃" : null;

  // Compute week label
  const weekLabel =
    weekOffset === 0
      ? "This Week"
      : weekOffset === -1
      ? "Last Week"
      : weekOffset === 1
      ? "Next Week"
      : weekOffset < 0
      ? `${Math.abs(weekOffset)} Weeks Ago`
      : `In ${weekOffset} Weeks`;

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#262626]">
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-wide">Cardio Calendar</p>
          <h3 className="font-bold text-white mt-0.5">{weekLabel}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setWeekOffset((w) => w - 1); setSelected(null); }}
            className="w-8 h-8 rounded-xl bg-[#262626] flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
            aria-label="Previous week"
          >
            ‹
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => { setWeekOffset(0); setSelected(null); }}
              className="px-2 h-8 rounded-xl bg-[#262626] text-xs text-[#0066FF] font-semibold hover:bg-[#333] transition-colors"
            >
              Today
            </button>
          )}
          <button
            onClick={() => { setWeekOffset((w) => w + 1); setSelected(null); }}
            className="w-8 h-8 rounded-xl bg-[#262626] flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
            aria-label="Next week"
          >
            ›
          </button>
        </div>
      </div>

      {/* Day Strip */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-px bg-[#1a1a1a] border-b border-[#262626]">
            {days.map((day) => {
              const act = day.activity;
              const sug = day.suggestion;
              const hasContent = !!act || !!sug;
              const contentType = act?.type || sug?.type;
              const dayIcon = contentType ? CARDIO_TYPE_ICONS[contentType] || "🏃" : null;
              const isSelected = day.date === selected;
              const isCompleted = act?.completed;

              return (
                <button
                  key={day.date}
                  onClick={() => setSelected(isSelected ? null : day.date)}
                  className={`bg-[#141414] flex flex-col items-center py-3 px-1 transition-all relative ${
                    isSelected ? "bg-[#0066FF]/10" : "hover:bg-[#1a1a1a]"
                  }`}
                >
                  {/* Day label */}
                  <span
                    className={`text-[10px] font-semibold mb-1.5 ${
                      day.isToday ? "text-[#0066FF]" : "text-neutral-500"
                    }`}
                  >
                    {DAY_LABELS[day.dayOfWeek]}
                  </span>

                  {/* Activity dot / icon */}
                  {hasContent ? (
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all ${
                        isCompleted
                          ? "bg-[#00C853]/15 border border-[#00C853]/30"
                          : day.isPast
                          ? "bg-[#262626] border border-[#333]"
                          : day.isToday
                          ? "bg-[#0066FF]/20 border border-[#0066FF]/40"
                          : "bg-[#1a1a1a] border border-[#262626]"
                      }`}
                    >
                      {dayIcon}
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center">
                      <span className="text-neutral-700 text-xs">—</span>
                    </div>
                  )}

                  {/* Completion checkmark */}
                  {isCompleted && (
                    <span className="text-[#00C853] text-[9px] mt-1 font-bold">✓</span>
                  )}

                  {/* Today indicator */}
                  {day.isToday && !isCompleted && (
                    <span className="w-1 h-1 rounded-full bg-[#0066FF] mt-1" />
                  )}

                  {/* Selected underline */}
                  {isSelected && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#0066FF] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Detail Panel */}
          {selectedDay && (
            <div className="px-5 py-4">
              <p className="text-xs text-neutral-500 mb-3">
                {DAY_LABELS[selectedDay.dayOfWeek]} · {formatDateLabel(selectedDay.date)}
              </p>

              {current ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white text-sm">
                            {isActivity
                              ? selectedDay.activity!.title || selectedDay.activity!.type
                              : selectedDay.suggestion!.title}
                          </p>
                          {isActivity && selectedDay.activity!.completed && (
                            <span className="text-[#00C853] text-xs font-bold">✓ Done</span>
                          )}
                          {!isActivity && (
                            <span className="text-xs text-[#0066FF] bg-[#0066FF]/10 px-2 py-0.5 rounded-full border border-[#0066FF]/20">
                              Planned
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          ⏱ {current.duration} min
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full border capitalize flex-shrink-0 ${intensityClass}`}
                    >
                      {intensityKey}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 space-y-1">
                  <p className="text-neutral-500 text-sm">
                    {selectedDay.isPast ? "No cardio logged" : "Rest day — no cardio planned"}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
