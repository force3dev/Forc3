"use client";

import { useEffect, useState } from "react";

type DayEntry = { date: string; slept: number | null; debt: number };

type SleepDebtData = {
  totalDebt: number;
  sleepTarget: number;
  days: DayEntry[];
  recommendation: string;
  optimalBedtime: string;
};

export default function SleepDebtCard() {
  const [data, setData] = useState<SleepDebtData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/health/sleep-debt")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return null;
  if (data.days.every((d) => d.slept === null)) return null; // No data yet

  const debtColor = data.totalDebt >= 5 ? "#ef4444" : data.totalDebt >= 2 ? "#FFB300" : "#00C853";
  const maxHours = 10;
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Sleep Debt</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black" style={{ color: debtColor }}>{data.totalDebt.toFixed(1)}</span>
            <span className="text-neutral-400 text-sm">hrs owed</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-500">Optimal bedtime</p>
          <p className="font-bold text-sm text-white">{data.optimalBedtime}</p>
        </div>
      </div>

      {/* 7-day bars */}
      <div className="grid grid-cols-7 gap-1">
        {data.days.map((d) => {
          const isToday = d.date === todayStr;
          const hours = d.slept ?? 0;
          const barHeight = Math.max(4, Math.round((hours / maxHours) * 60));
          const targetHeight = Math.round((data.sleepTarget / maxHours) * 60);
          const dayLabel = new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "narrow" });
          const barColor = d.slept === null ? "#1a1a1a" : hours >= data.sleepTarget ? "#00C853" : hours >= data.sleepTarget * 0.8 ? "#FFB300" : "#ef4444";

          return (
            <div key={d.date} className="flex flex-col items-center gap-1">
              <div className="flex flex-col justify-end relative" style={{ height: 60 }}>
                {/* Target line */}
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-neutral-700"
                  style={{ bottom: targetHeight - 1 }}
                />
                {/* Bar */}
                <div
                  className="w-full rounded-t transition-all"
                  style={{ height: barHeight, background: barColor, minHeight: 4 }}
                />
              </div>
              <span className={`text-[10px] ${isToday ? "text-[#0066FF] font-bold" : "text-neutral-600"}`}>{dayLabel}</span>
              {d.slept !== null && (
                <span className="text-[9px] text-neutral-700">{d.slept}h</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Recommendation */}
      <p className="text-xs text-neutral-400 leading-relaxed">{data.recommendation}</p>
    </div>
  );
}
