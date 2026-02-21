"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface WeeklyAnalysis {
  weekStart: string;
  weekEnd: string;
  workoutsCompleted: number;
  targetWorkouts: number;
  totalVolume: number;
  avgRpe: number | null;
  prsHit: number;
  complianceRate: number;
  volumeTrend: string;
  strengthTrend: string;
  recoveryScore: number;
  insights: string[];
  recommendations: string[];
  nextWeekFocus: string;
}

function TrendBadge({ trend }: { trend: string }) {
  const config = {
    increasing: { label: "Increasing", className: "text-[#00C853] bg-[#00C853]/10 border-[#00C853]/30" },
    decreasing: { label: "Decreasing", className: "text-red-400 bg-red-400/10 border-red-400/30" },
    stable: { label: "Stable", className: "text-[#FFB300] bg-[#FFB300]/10 border-[#FFB300]/30" },
    first_week: { label: "Starting Out", className: "text-[#0066FF] bg-[#0066FF]/10 border-[#0066FF]/30" },
  }[trend] || { label: trend, className: "text-neutral-400 bg-neutral-400/10 border-neutral-400/30" };

  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${config.className}`}>
      {config.label}
    </span>
  );
}

export default function WeeklyPage() {
  const router = useRouter();
  const [data, setData] = useState<WeeklyAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/progress/weekly")
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const weekLabel = data
    ? `${new Date(data.weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(data.weekEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : "";

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      <header className="px-6 pt-8 pb-4 flex items-center gap-3">
        <button
          onClick={() => router.push("/progress")}
          className="text-neutral-500 text-sm hover:text-white transition-colors"
        >
          ← Back
        </button>
        <div>
          <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3</div>
          <h1 className="text-2xl font-bold">Weekly Report</h1>
          {weekLabel && <p className="text-sm text-neutral-500">{weekLabel}</p>}
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data ? (
        <div className="px-6 text-center py-16 text-neutral-500">Failed to load report</div>
      ) : (
        <div className="px-6 space-y-5">
          {/* Compliance */}
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-neutral-300">Weekly Compliance</span>
              <span className="text-2xl font-bold text-[#0066FF]">
                {data.workoutsCompleted}/{data.targetWorkouts}
              </span>
            </div>
            <div className="w-full h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all bg-[#0066FF]"
                style={{ width: `${Math.min(100, data.complianceRate * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-neutral-500 mt-1.5">
              <span>0 sessions</span>
              <span>{data.targetWorkouts} goal</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-3 text-center">
              <div className="text-xl font-bold text-[#FFB300]">{data.prsHit}</div>
              <div className="text-xs text-neutral-500 mt-0.5">PRs Hit</div>
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-3 text-center">
              <div className="text-xl font-bold">
                {data.totalVolume >= 1000
                  ? `${(data.totalVolume / 1000).toFixed(1)}k`
                  : Math.round(data.totalVolume)}
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">Lbs</div>
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-3 text-center">
              <div className="text-xl font-bold text-[#00C853]">{data.recoveryScore}/10</div>
              <div className="text-xs text-neutral-500 mt-0.5">Recovery</div>
            </div>
          </div>

          {/* Trends */}
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 space-y-3">
            <h3 className="font-bold">Trends</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Volume</span>
              <TrendBadge trend={data.volumeTrend} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Strength</span>
              <TrendBadge trend={data.strengthTrend} />
            </div>
            {data.avgRpe !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">Avg RPE</span>
                <span className="text-sm font-semibold">{data.avgRpe.toFixed(1)}/10</span>
              </div>
            )}
          </div>

          {/* Insights */}
          {data.insights.length > 0 && (
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 space-y-2">
              <h3 className="font-bold mb-1">This Week</h3>
              {data.insights.map((insight, i) => (
                <div key={i} className="flex gap-2 text-sm text-neutral-300">
                  <span className="text-[#0066FF] mt-0.5">›</span>
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {data.recommendations.length > 0 && (
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 space-y-2">
              <h3 className="font-bold mb-1">Next Steps</h3>
              {data.recommendations.map((rec, i) => (
                <div key={i} className="flex gap-2 text-sm text-neutral-300">
                  <span className="text-[#FFB300] mt-0.5">›</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          )}

          {/* Next week focus */}
          <div className="bg-[#0066FF]/10 border border-[#0066FF]/30 rounded-2xl p-4">
            <div className="text-xs text-[#0066FF] font-semibold uppercase tracking-wide mb-1">
              Next Week Focus
            </div>
            <p className="text-sm font-semibold">{data.nextWeekFocus}</p>
          </div>
        </div>
      )}
    </main>
  );
}
