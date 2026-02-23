"use client";
import { useState, useEffect, useRef } from "react";
import { CARDIO_TYPE_ICONS, INTENSITY_COLORS, CardioInterval } from "@/lib/cardio-templates";

interface CardioSuggestion {
  templateId: string;
  type: string;
  title: string;
  description: string;
  duration: number;
  intensity: string;
  intervals?: CardioInterval[] | null;
}

interface CardioActivity {
  id: string;
  type: string;
  title?: string | null;
  description?: string | null;
  intensity?: string | null;
  duration: number;
  intervals?: CardioInterval[] | null;
  completed: boolean;
}

interface CardioBlockData {
  activity: CardioActivity | null;
  suggestion?: CardioSuggestion | null;
  isPlanned?: boolean;
}

function TimerDisplay({ seconds, running }: { seconds: number; running: boolean }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <div className={`tabular-nums text-2xl font-bold ${running ? "text-[#00C853]" : "text-white"}`}>
      {mins}:{secs.toString().padStart(2, "0")}
    </div>
  );
}

export default function CardioBlock() {
  const [data, setData] = useState<CardioBlockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [toast, setToast] = useState(false);
  const [activityId, setActivityId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/cardio/today")
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  // Timer
  useEffect(() => {
    if (timerActive) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerActive]);

  if (loading) return null;
  if (!data) return null;

  const current = data.activity || data.suggestion;
  if (!current) return null;

  const isCompleted = data.activity?.completed;
  const type = current.type;
  const icon = CARDIO_TYPE_ICONS[type] || "🏃";
  const intensityClass = INTENSITY_COLORS[(current as CardioSuggestion).intensity || "moderate"];
  const displayDuration = (current as CardioSuggestion).duration;
  const hasIntervals = (current as CardioSuggestion).intervals && (current as CardioSuggestion).intervals!.length > 0;

  const handleStart = async () => {
    setTimerActive(true);
    setExpanded(true);
    // Create the activity in DB if it's a suggestion
    if (!data.activity && data.suggestion) {
      const res = await fetch("/api/cardio/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", templateId: data.suggestion.templateId }),
      });
      const result = await res.json();
      if (result.activity) setActivityId(result.activity.id);
    } else if (data.activity) {
      setActivityId(data.activity.id);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    setTimerActive(false);
    const id = activityId || data.activity?.id;
    if (id) {
      await fetch("/api/cardio/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", activityId: id, duration: Math.round(elapsed / 60) || displayDuration }),
      });
    }
    setCompleting(false);
    setToast(true);
    setTimeout(() => {
      setToast(false);
      setData(prev => prev ? { ...prev, activity: { ...(prev.activity || {} as CardioActivity), completed: true } } : null);
    }, 2000);
  };

  const title = (current as CardioSuggestion).title || type;
  const description = (current as CardioSuggestion).description || "";

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-4 right-4 z-50">
          <div className="bg-[#141414] border border-[#00C853]/40 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-lg">
            <div className="w-8 h-8 rounded-full bg-[#00C853]/20 border border-[#00C853]/50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-[#00C853]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-bold text-white text-sm">Workout Complete! 💪</p>
          </div>
        </div>
      )}

      <div className={`bg-[#141414] border rounded-2xl overflow-hidden transition-all ${
        isCompleted ? "border-[#262626] opacity-70" : "border-[#262626]"
      }`}>
        {/* Header */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-neutral-500 uppercase tracking-wide">Cardio</p>
                  {isCompleted && <span className="text-[#00C853] text-xs">✓ Done</span>}
                </div>
                <h3 className="font-bold text-white">{title}</h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {timerActive && <TimerDisplay seconds={elapsed} running={timerActive} />}
              <span className={`text-xs px-2 py-1 rounded-full border capitalize ${intensityClass}`}>
                {(current as CardioSuggestion).intensity}
              </span>
            </div>
          </div>

          {/* Duration badge */}
          <div className="mt-2 flex items-center gap-3">
            <span className="text-xs text-neutral-500">⏱ {displayDuration} min</span>
            {hasIntervals && <span className="text-xs text-neutral-500">• Intervals included</span>}
          </div>
        </div>

        {/* Expand/collapse description */}
        {!isCompleted && (
          <div className="px-5 pb-4 space-y-3">
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-xs text-[#0066FF] hover:text-[#0052CC] transition-colors flex items-center gap-1"
            >
              {expanded ? "Hide instructions ↑" : "Show instructions ↓"}
            </button>

            {expanded && (
              <div className="space-y-3">
                <p className="text-sm text-neutral-300 leading-relaxed">{description}</p>

                {/* Intervals breakdown */}
                {hasIntervals && (
                  <div className="bg-[#0a0a0a] rounded-xl p-3 space-y-2">
                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Workout Structure</p>
                    {(current as CardioSuggestion).intervals!.map((interval, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-neutral-200">{interval.label}</span>
                        <div className="text-right">
                          <span className="text-[#0066FF]">{interval.work}</span>
                          {interval.rest !== "0" && (
                            <span className="text-neutral-500 ml-1">/ {interval.rest} rest</span>
                          )}
                          {interval.reps > 1 && (
                            <span className="text-neutral-500 ml-1">× {interval.reps}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              {!timerActive ? (
                <button
                  onClick={handleStart}
                  className="flex-1 py-3 bg-[#0066FF] text-white font-semibold rounded-xl text-sm hover:bg-[#0052CC] transition-colors"
                >
                  {elapsed > 0 ? "Resume" : "Start"}
                </button>
              ) : (
                <button
                  onClick={() => setTimerActive(false)}
                  className="flex-1 py-3 bg-[#1a1a1a] border border-[#262626] text-neutral-300 font-semibold rounded-xl text-sm hover:text-white transition-colors"
                >
                  Pause
                </button>
              )}
              <button
                onClick={handleComplete}
                disabled={completing}
                className="flex-1 py-3 bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/30 font-semibold rounded-xl text-sm hover:bg-[#00C853]/30 transition-colors disabled:opacity-50"
              >
                {completing ? "Saving..." : "Complete"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
