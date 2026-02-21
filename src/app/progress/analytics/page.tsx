"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VolumePoint { date: string; volume: number }
interface FreqPoint { week: string; count: number }
interface StrengthSeries { [exercise: string]: { date: string; value: number }[] }

interface AnalyticsData {
  volumeSeries: VolumePoint[];
  strengthSeries: StrengthSeries;
  weeklyFreq: FreqPoint[];
  totalWorkouts: number;
  totalVolume: number;
}

type RangeOption = "7" | "30" | "90";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatWeekShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatVolume(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, unit }: {
  active?: boolean;
  payload?: Array<{ value: number; name?: string }>;
  label?: string;
  unit?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl px-3 py-2 text-xs">
      <p className="text-neutral-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold text-white">
          {p.name && <span className="text-neutral-400 mr-1">{p.name}:</span>}
          {formatVolume(p.value)} {unit || "lbs"}
        </p>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeOption>("30");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/progress/analytics?range=${range}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [range]);

  const rangeOptions: { key: RangeOption; label: string }[] = [
    { key: "7", label: "7 Days" },
    { key: "30", label: "30 Days" },
    { key: "90", label: "90 Days" },
  ];

  const exerciseNames = data ? Object.keys(data.strengthSeries) : [];

  // Merge strength series into unified chart data
  const strengthChartData: Record<string, { date: string; [key: string]: string | number }>[] = [];
  if (data) {
    const allDates = new Set<string>();
    for (const pts of Object.values(data.strengthSeries)) {
      pts.forEach(p => allDates.add(p.date));
    }
    const sorted = Array.from(allDates).sort();
    for (const date of sorted) {
      const row: { date: string; [key: string]: string | number } = { date };
      for (const [name, pts] of Object.entries(data.strengthSeries)) {
        const pt = pts.find(p => p.date === date);
        if (pt) row[name] = pt.value;
      }
      strengthChartData.push(row as unknown as Record<string, { date: string; [key: string]: string | number }>);
    }
  }

  const COLORS = ["#0066FF", "#FFB300", "#00C853"];

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
          <h1 className="text-2xl font-bold">Analytics</h1>
        </div>
      </header>

      {/* Range selector */}
      <div className="px-6 mb-6">
        <div className="flex bg-[#141414] border border-[#262626] rounded-xl p-1 gap-1">
          {rangeOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => setRange(opt.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                range === opt.key ? "bg-[#0066FF] text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data || data.totalWorkouts === 0 ? (
        <div className="px-6 text-center py-16 space-y-3">
          <div className="text-5xl">📊</div>
          <p className="font-semibold">No data yet</p>
          <p className="text-sm text-neutral-500">Complete some workouts to see your analytics.</p>
        </div>
      ) : (
        <div className="px-6 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
              <div className="text-xs text-neutral-500 uppercase tracking-wide">Workouts</div>
              <div className="text-3xl font-bold mt-1 text-[#0066FF]">{data.totalWorkouts}</div>
              <div className="text-xs text-neutral-500 mt-0.5">in this period</div>
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
              <div className="text-xs text-neutral-500 uppercase tracking-wide">Total Volume</div>
              <div className="text-3xl font-bold mt-1">
                {data.totalVolume >= 1000
                  ? `${(data.totalVolume / 1000).toFixed(1)}k`
                  : data.totalVolume}
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">lbs lifted</div>
            </div>
          </div>

          {/* Volume Chart */}
          {data.volumeSeries.length > 1 && (
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
              <h3 className="font-bold mb-4">Daily Volume</h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={data.volumeSeries} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0066FF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0066FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1a1a1a" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateShort}
                    tick={{ fill: "#666", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickFormatter={formatVolume}
                    tick={{ fill: "#666", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip unit="lbs" />} />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="#0066FF"
                    strokeWidth={2}
                    fill="url(#volGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Weekly Frequency Chart */}
          {data.weeklyFreq.length > 1 && (
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
              <h3 className="font-bold mb-4">Weekly Sessions</h3>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={data.weeklyFreq} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#1a1a1a" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="week"
                    tickFormatter={formatWeekShort}
                    tick={{ fill: "#666", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: "#666", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip unit="sessions" />} />
                  <Bar dataKey="count" fill="#0066FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Strength Trends */}
          {exerciseNames.length > 0 && (
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
              <h3 className="font-bold mb-1">Strength Trends</h3>
              <p className="text-xs text-neutral-500 mb-4">Est. 1RM over time</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={strengthChartData as unknown as Record<string, string | number>[]}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid stroke="#1a1a1a" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateShort}
                    tick={{ fill: "#666", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: "#666", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip unit="lbs" />} />
                  <Legend
                    wrapperStyle={{ fontSize: 10, color: "#999" }}
                    iconType="circle"
                    iconSize={8}
                  />
                  {exerciseNames.map((name, i) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: COLORS[i % COLORS.length] }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
