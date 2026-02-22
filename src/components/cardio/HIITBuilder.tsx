"use client";
import { useState } from "react";

interface Interval {
  type: "work" | "rest";
  duration: number;
  name: string;
}

interface Props {
  onStart: (config: { intervals: Interval[]; rounds: number }) => void;
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function HIITBuilder({ onStart }: Props) {
  const [intervals, setIntervals] = useState<Interval[]>([
    { type: "work", duration: 30, name: "Sprint" },
    { type: "rest", duration: 30, name: "Rest" },
  ]);
  const [rounds, setRounds] = useState(8);

  const totalDuration = intervals.reduce((s, i) => s + i.duration, 0) * rounds;

  const updateInterval = (idx: number, patch: Partial<Interval>) => {
    setIntervals(prev => prev.map((iv, i) => i === idx ? { ...iv, ...patch } : iv));
  };

  const addInterval = (type: "work" | "rest") => {
    setIntervals(prev => [
      ...prev,
      { type, duration: 30, name: type === "work" ? "Sprint" : "Rest" },
    ]);
  };

  const removeInterval = (idx: number) => {
    setIntervals(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="p-5 space-y-5">
      <h2 className="text-xl font-bold">Build Your HIIT</h2>

      {/* Intervals */}
      <div className="space-y-2">
        {intervals.map((interval, i) => (
          <div
            key={i}
            className={`border rounded-xl p-3 flex items-center gap-3 ${
              interval.type === "work"
                ? "bg-red-900/10 border-red-900/30"
                : "bg-green-900/10 border-green-900/30"
            }`}
          >
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
              interval.type === "work" ? "bg-red-500" : "bg-[#00C853]"
            }`} />
            <input
              type="text"
              value={interval.name}
              onChange={e => updateInterval(i, { name: e.target.value })}
              className="flex-1 bg-transparent text-sm font-medium focus:outline-none"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={interval.duration}
                onChange={e => updateInterval(i, { duration: parseInt(e.target.value) || 10 })}
                min={5}
                className="w-14 bg-black/40 border border-[#262626] rounded-lg px-2 py-1 text-center text-sm focus:border-[#0066FF] focus:outline-none"
              />
              <span className="text-neutral-500 text-xs">sec</span>
            </div>
            {intervals.length > 2 && (
              <button
                onClick={() => removeInterval(i)}
                className="text-neutral-600 hover:text-red-400 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Interval */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => addInterval("work")}
          className="py-2.5 bg-red-900/20 text-red-400 rounded-xl text-sm font-semibold hover:bg-red-900/30 transition-colors"
        >
          + Work
        </button>
        <button
          onClick={() => addInterval("rest")}
          className="py-2.5 bg-green-900/20 text-[#00C853] rounded-xl text-sm font-semibold hover:bg-green-900/30 transition-colors"
        >
          + Rest
        </button>
      </div>

      {/* Rounds */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 flex items-center justify-between">
        <span className="font-semibold">Rounds</span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setRounds(r => Math.max(1, r - 1))}
            className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center text-xl font-bold hover:bg-[#333] transition-colors"
          >
            −
          </button>
          <span className="text-2xl font-bold w-8 text-center">{rounds}</span>
          <button
            onClick={() => setRounds(r => r + 1)}
            className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center text-xl font-bold hover:bg-[#333] transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Total Time */}
      <div className="text-center text-sm">
        <span className="text-neutral-500">Total Time: </span>
        <span className="font-bold text-[#0066FF]">{formatDuration(totalDuration)}</span>
      </div>

      {/* Start */}
      <button
        onClick={() => onStart({ intervals, rounds })}
        className="w-full py-4 bg-[#0066FF] text-white font-bold rounded-xl hover:bg-[#0052CC] transition-colors"
      >
        Start HIIT
      </button>
    </div>
  );
}
