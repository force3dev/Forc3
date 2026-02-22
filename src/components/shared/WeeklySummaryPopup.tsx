"use client";
import { useEffect, useState } from "react";

interface WeeklyData {
  complianceRate: number;
  totalWorkouts: number;
  totalVolume: number;
  insights: string[];
  recommendations: string[];
  overallScore?: number;
  motivationalNote?: string;
}

export default function WeeklySummaryPopup() {
  const [data, setData] = useState<WeeklyData | null>(null);
  const [dismissed, setDismissed] = useState(true); // start dismissed

  useEffect(() => {
    // Show on Mondays (day 1) and only if not dismissed today
    const today = new Date();
    if (today.getDay() !== 1) return; // only Monday

    const lastShown = localStorage.getItem("weeklySummaryShown");
    const todayStr = today.toISOString().slice(0, 10);
    if (lastShown === todayStr) return;

    // Load weekly data
    fetch("/api/progress/weekly")
      .then(r => r.json())
      .then(d => {
        if (d.totalWorkouts > 0) {
          setData(d);
          setDismissed(false);
        }
      })
      .catch(() => {});
  }, []);

  function dismiss() {
    const todayStr = new Date().toISOString().slice(0, 10);
    localStorage.setItem("weeklySummaryShown", todayStr);
    setDismissed(true);
  }

  if (dismissed || !data) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-4">
      <div className="bg-[#141414] border border-[#262626] rounded-3xl w-full max-w-sm overflow-hidden">
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs text-[#0066FF] font-bold tracking-widest">WEEKLY RECAP</div>
              <h2 className="text-xl font-bold mt-1">Last Week</h2>
            </div>
            <button
              onClick={dismiss}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-[#1a1a1a] text-neutral-400"
            >
              ✕
            </button>
          </div>

          {/* Score */}
          {data.overallScore !== undefined && (
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl border-4"
                style={{
                  borderColor: data.overallScore >= 80 ? "#00C853" : data.overallScore >= 60 ? "#FFB300" : "#FF4444",
                  color: data.overallScore >= 80 ? "#00C853" : data.overallScore >= 60 ? "#FFB300" : "#FF4444",
                }}
              >
                {data.overallScore}
              </div>
              <div>
                <div className="font-semibold">Overall Score</div>
                <div className="text-sm text-neutral-400">
                  {data.totalWorkouts} workout{data.totalWorkouts !== 1 ? "s" : ""} · {Math.round(data.complianceRate)}% compliance
                </div>
              </div>
            </div>
          )}

          {/* Motivational note */}
          {data.motivationalNote && (
            <div className="mb-4 p-3 bg-[#0066FF]/10 border border-[#0066FF]/20 rounded-xl">
              <p className="text-sm text-[#60A5FA] italic">&quot;{data.motivationalNote}&quot;</p>
            </div>
          )}

          {/* Key insight */}
          {data.insights.length > 0 && (
            <div className="text-sm text-neutral-300 mb-3">
              <span className="text-neutral-500">Insight: </span>{data.insights[0]}
            </div>
          )}

          {/* Top recommendation */}
          {data.recommendations.length > 0 && (
            <div className="p-3 bg-[#00C853]/10 border border-[#00C853]/20 rounded-xl text-sm text-[#00C853] mb-4">
              {data.recommendations[0]}
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={dismiss}
            className="flex-1 py-3 bg-[#0a0a0a] border border-[#262626] rounded-xl font-semibold text-sm"
          >
            Dismiss
          </button>
          <button
            onClick={() => { dismiss(); window.location.href = "/progress/weekly"; }}
            className="flex-1 py-3 bg-[#0066FF] text-white rounded-xl font-semibold text-sm"
          >
            Full Report
          </button>
        </div>
      </div>
    </div>
  );
}
