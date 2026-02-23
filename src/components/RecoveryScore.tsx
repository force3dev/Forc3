"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface RecoveryData {
  score: number;
  status: "excellent" | "good" | "moderate" | "low" | "rest_needed";
  recommendation: string;
}

interface Props {
  isPremium: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  excellent: "#00C853",
  good: "#00C853",
  moderate: "#FFB300",
  low: "#FF6D00",
  rest_needed: "#FF1744",
};

const STATUS_LABELS: Record<string, string> = {
  excellent: "Excellent",
  good: "Good",
  moderate: "Moderate",
  low: "Low",
  rest_needed: "Rest Needed",
};

export default function RecoveryScore({ isPremium }: Props) {
  const router = useRouter();
  const [data, setData] = useState<RecoveryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/progress/recovery")
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  // Placeholder data if API unavailable
  const recovery: RecoveryData = data || { score: 72, status: "good", recommendation: "Train as planned today." };

  const color = STATUS_COLORS[recovery.status] || "#0066FF";
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (recovery.score / 100) * circumference;

  if (!isPremium) {
    return (
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 relative overflow-hidden">
        <div className="flex items-center gap-4 blur-sm select-none pointer-events-none">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r={radius} fill="none" stroke="#1e1e1e" strokeWidth="8" />
              <circle
                cx="44"
                cy="44"
                r={radius}
                fill="none"
                stroke="#00C853"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-white">72</span>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Good</div>
            <div className="text-xs text-neutral-500 mt-0.5">Train as planned today.</div>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
          <button
            onClick={() => router.push("/upgrade")}
            className="text-xs font-semibold text-[#FFB300] border border-[#FFB300]/30 bg-[#FFB300]/10 px-4 py-2 rounded-xl hover:bg-[#FFB300]/20 transition-colors"
          >
            🔒 Unlock Recovery Score — Upgrade
          </button>
        </div>
        <div className="absolute top-3 left-5">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">Recovery</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
      <p className="text-xs text-neutral-500 uppercase tracking-wide mb-3">Recovery Score</p>
      <div className="flex items-center gap-4">
        {/* Circular progress */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r={radius} fill="none" stroke="#1e1e1e" strokeWidth="8" />
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-white">{recovery.score}</span>
          </div>
        </div>

        {/* Status + recommendation */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm" style={{ color }}>
            {STATUS_LABELS[recovery.status]}
          </div>
          <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{recovery.recommendation}</p>
        </div>
      </div>
    </div>
  );
}
