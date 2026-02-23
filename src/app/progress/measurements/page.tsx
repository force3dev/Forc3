"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

interface BodyMeasurement {
  id: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  neck?: number;
  leftArm?: number;
  rightArm?: number;
  leftThigh?: number;
  rightThigh?: number;
  notes?: string;
}

const FIELDS = [
  { key: "weight", label: "Weight", unit: "lbs", color: "#0066FF" },
  { key: "bodyFat", label: "Body Fat", unit: "%", color: "#FFB300" },
  { key: "waist", label: "Waist", unit: "in", color: "#FF4444" },
  { key: "chest", label: "Chest", unit: "in", color: "#00C853" },
  { key: "hips", label: "Hips", unit: "in", color: "#9C27B0" },
  { key: "leftArm", label: "Arm", unit: "in", color: "#FF6B35" },
];

function computeNavyBF(
  sex: string,
  waist: number,
  neck: number,
  height: number,
  hips?: number
): number | null {
  if (!waist || !neck || !height || waist <= neck) return null;
  if (sex === "female" && (!hips || hips <= 0)) return null;
  try {
    if (sex === "female" && hips) {
      const val = 495 / (1.29579 - 0.35004 * Math.log10(waist + hips - neck) + 0.22100 * Math.log10(height)) - 450;
      return Math.max(0, Math.min(70, parseFloat(val.toFixed(1))));
    } else {
      const val = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
      return Math.max(0, Math.min(70, parseFloat(val.toFixed(1))));
    }
  } catch { return null; }
}

export default function MeasurementsPage() {
  const router = useRouter();
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeChart, setActiveChart] = useState("weight");
  const [profile, setProfile] = useState<{ sex?: string; height?: number } | null>(null);

  const [form, setForm] = useState({
    weight: "", bodyFat: "", chest: "", waist: "", hips: "",
    neck: "", leftArm: "", rightArm: "", leftThigh: "", rightThigh: "", notes: "",
  });

  async function loadData() {
    try {
      const res = await fetch("/api/progress/measurements");
      if (res.ok) {
        const data = await res.json();
        setMeasurements(data.measurements || []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    fetch("/api/user/profile").then(r => r.json()).then(d => setProfile({ sex: d.sex, height: d.height })).catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/progress/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({
        weight: "", bodyFat: "", chest: "", waist: "", hips: "",
        neck: "", leftArm: "", rightArm: "", leftThigh: "", rightThigh: "", notes: "",
      });
      setShowForm(false);
      loadData();
    } finally {
      setSaving(false);
    }
  }

  // Build chart data (ascending date order)
  const chartData = [...measurements]
    .reverse()
    .filter(m => m[activeChart as keyof BodyMeasurement] !== null && m[activeChart as keyof BodyMeasurement] !== undefined)
    .map(m => ({
      date: new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: m[activeChart as keyof BodyMeasurement] as number,
    }));

  const activeField = FIELDS.find(f => f.key === activeChart) || FIELDS[0];
  const latest = measurements[0];
  const prev = measurements[1];

  function getDelta(key: string) {
    if (!latest || !prev) return null;
    const a = latest[key as keyof BodyMeasurement] as number | undefined;
    const b = prev[key as keyof BodyMeasurement] as number | undefined;
    if (a === undefined || b === undefined || a === null || b === null) return null;
    return a - b;
  }

  return (
    <main className="min-h-screen bg-black text-white pb-10">
      <header className="px-6 pt-8 pb-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a1a] text-neutral-400 hover:text-white"
        >
          ←
        </button>
        <div>
          <h1 className="text-xl font-bold">Body Measurements</h1>
          <p className="text-sm text-neutral-500">Track your physical changes</p>
        </div>
      </header>

      <div className="px-6 space-y-5">
        {/* Chart selector tabs */}
        {measurements.length > 1 && (
          <div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {FIELDS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveChart(f.key)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                    activeChart === f.key
                      ? "text-white"
                      : "bg-[#1a1a1a] text-neutral-400"
                  }`}
                  style={activeChart === f.key ? { backgroundColor: f.color } : {}}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 mt-3">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-lg font-bold">{activeField.label}</span>
                  {latest?.[activeChart as keyof BodyMeasurement] !== undefined && (
                    <span className="ml-2 text-2xl font-bold tabular-nums" style={{ color: activeField.color }}>
                      {latest[activeChart as keyof BodyMeasurement]}{activeField.unit}
                    </span>
                  )}
                </div>
                {getDelta(activeChart) !== null && (
                  <div className={`text-sm font-bold ${getDelta(activeChart)! < 0 ? "text-[#00C853]" : "text-red-400"}`}>
                    {getDelta(activeChart)! > 0 ? "+" : ""}{getDelta(activeChart)?.toFixed(1)}{activeField.unit}
                  </div>
                )}
              </div>
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                    <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#666", fontSize: 10 }} domain={["auto", "auto"]} />
                    <Tooltip
                      contentStyle={{ background: "#141414", border: "1px solid #262626", borderRadius: 8 }}
                      labelStyle={{ color: "#999" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={activeField.color}
                      strokeWidth={2}
                      dot={{ fill: activeField.color, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-neutral-500 text-center py-4">Add more entries to see the trend</p>
              )}
            </div>
          </div>
        )}

        {/* Latest stats grid */}
        {latest && (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
            <div className="text-sm font-semibold text-neutral-400 mb-3">
              Latest — {new Date(latest.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {FIELDS.filter(f => latest[f.key as keyof BodyMeasurement] !== undefined && latest[f.key as keyof BodyMeasurement] !== null).map(f => (
                <div key={f.key} className="bg-[#0a0a0a] rounded-xl p-3">
                  <div className="text-xs text-neutral-500">{f.label}</div>
                  <div className="font-bold tabular-nums" style={{ color: f.color }}>
                    {latest[f.key as keyof BodyMeasurement]}{f.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navy Body Fat Estimate */}
        {latest && profile?.height && latest.neck && latest.waist && (() => {
          const navyBF = computeNavyBF(
            profile.sex || "male",
            latest.waist!,
            latest.neck!,
            profile.height!,
            latest.hips
          );
          if (navyBF === null) return null;
          const weight = latest.weight;
          const leanMass = weight ? parseFloat((weight * (1 - navyBF / 100)).toFixed(1)) : null;
          const fatMass = weight ? parseFloat((weight * navyBF / 100).toFixed(1)) : null;
          const prevNavyBF = prev && profile?.height && prev.neck && prev.waist
            ? computeNavyBF(profile.sex || "male", prev.waist!, prev.neck!, profile.height!, prev.hips)
            : null;
          const bfDelta = prevNavyBF !== null ? parseFloat((navyBF - prevNavyBF).toFixed(1)) : null;
          return (
            <div className="bg-[#141414] border border-[#0066FF]/30 rounded-2xl p-4">
              <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-3">Navy Body Fat Estimate</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#0a0a0a] rounded-xl p-3">
                  <p className="text-xs text-neutral-500">Body Fat</p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-xl text-[#FFB300]">{navyBF}%</span>
                    {bfDelta !== null && (
                      <span className={`text-xs font-semibold ${bfDelta < 0 ? "text-[#00C853]" : "text-red-400"}`}>
                        {bfDelta > 0 ? "+" : ""}{bfDelta}%
                      </span>
                    )}
                  </div>
                </div>
                {leanMass && (
                  <div className="bg-[#0a0a0a] rounded-xl p-3">
                    <p className="text-xs text-neutral-500">Lean Mass</p>
                    <p className="font-bold text-xl text-[#00C853]">{leanMass}<span className="text-xs text-neutral-500 ml-0.5">lbs</span></p>
                  </div>
                )}
                {fatMass && (
                  <div className="bg-[#0a0a0a] rounded-xl p-3">
                    <p className="text-xs text-neutral-500">Fat Mass</p>
                    <p className="font-bold text-xl text-[#FF4444]">{fatMass}<span className="text-xs text-neutral-500 ml-0.5">lbs</span></p>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-neutral-700 mt-2">U.S. Navy formula using neck + waist{profile.sex === "female" ? " + hips" : ""} + height</p>
            </div>
          );
        })()}

        {/* Log button */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-4 bg-[#0066FF] text-white font-bold rounded-2xl hover:bg-[#0052CC] transition-colors"
          >
            + Log Measurements
          </button>
        ) : (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Log Today</h3>
              <button onClick={() => setShowForm(false)} className="text-neutral-500">✕</button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "weight", label: "Weight (lbs)" },
                  { key: "bodyFat", label: "Body Fat (%)" },
                  { key: "chest", label: "Chest (in)" },
                  { key: "waist", label: "Waist (in)" },
                  { key: "hips", label: "Hips (in)" },
                  { key: "neck", label: "Neck (in)" },
                  { key: "leftArm", label: "Left Arm (in)" },
                  { key: "rightArm", label: "Right Arm (in)" },
                  { key: "leftThigh", label: "Left Thigh (in)" },
                  { key: "rightThigh", label: "Right Thigh (in)" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-neutral-400">{f.label}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form[f.key as keyof typeof form]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder="—"
                      className="mt-1 w-full p-2.5 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none text-sm"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-neutral-400">Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional note"
                  className="mt-1 w-full p-2.5 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className={`w-full py-3 font-bold rounded-xl transition-all ${
                  saving ? "bg-neutral-800 text-neutral-500" : "bg-[#0066FF] text-white hover:bg-[#0052CC]"
                }`}
              >
                {saving ? "Saving..." : "Save Measurements"}
              </button>
            </form>
          </div>
        )}

        {/* History list */}
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : measurements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-[#141414] border border-[#262626] rounded-2xl">
            <div className="text-4xl mb-3">📏</div>
            <p className="font-semibold text-neutral-300">No measurements yet</p>
            <p className="text-sm text-neutral-500 mt-1">Tap Log Measurements to get started</p>
          </div>
        ) : (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#262626]">
              <h3 className="text-sm font-semibold text-neutral-300">History</h3>
            </div>
            <div className="divide-y divide-[#1a1a1a]">
              {measurements.slice(0, 20).map(m => (
                <div key={m.id} className="px-5 py-3">
                  <div className="text-xs text-neutral-500 mb-2">
                    {new Date(m.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {FIELDS.filter(f => m[f.key as keyof BodyMeasurement] !== undefined && m[f.key as keyof BodyMeasurement] !== null).map(f => (
                      <span key={f.key} className="text-sm">
                        <span className="text-neutral-400">{f.label}: </span>
                        <span className="font-semibold" style={{ color: f.color }}>
                          {m[f.key as keyof BodyMeasurement]}{f.unit}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
