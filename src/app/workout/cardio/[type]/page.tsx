"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CARDIO_TEMPLATES, type CardioTemplate } from "@/lib/cardio-templates";
import { HIITBuilder } from "@/components/cardio/HIITBuilder";

const CARDIO_META: Record<string, { name: string; icon: string; hasGPS: boolean; hasIntervals: boolean }> = {
  running: { name: "Running", icon: "🏃", hasGPS: true, hasIntervals: false },
  cycling: { name: "Cycling", icon: "🚴", hasGPS: true, hasIntervals: false },
  swimming: { name: "Swimming", icon: "🏊", hasGPS: false, hasIntervals: false },
  hiit: { name: "HIIT", icon: "⚡", hasGPS: false, hasIntervals: true },
  rowing: { name: "Rowing", icon: "🚣", hasGPS: false, hasIntervals: false },
  jump_rope: { name: "Jump Rope", icon: "🪢", hasGPS: false, hasIntervals: false },
  elliptical: { name: "Elliptical", icon: "🔁", hasGPS: false, hasIntervals: false },
  walking: { name: "Walking", icon: "🚶", hasGPS: true, hasIntervals: false },
  stair_climber: { name: "Stair Climber", icon: "🪜", hasGPS: false, hasIntervals: false },
  sports: { name: "Sports", icon: "⚽", hasGPS: false, hasIntervals: false },
};

interface HIITConfig {
  intervals: { type: "work" | "rest"; duration: number; name: string }[];
  rounds: number;
}

function formatTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatPace(minPerMile: number) {
  if (!minPerMile || !isFinite(minPerMile)) return "--:--";
  const m = Math.floor(minPerMile);
  const s = Math.round((minPerMile - m) * 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function StatBox({ label, value, unit }: { label: string; value: string | number; unit: string }) {
  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 text-center">
      <div className="text-3xl font-bold font-mono">
        {value}
        <span className="text-base text-neutral-500 ml-1">{unit}</span>
      </div>
      <div className="text-xs text-neutral-500 mt-1">{label}</div>
    </div>
  );
}

export default function CardioTrackingPage() {
  const router = useRouter();
  const params = useParams<{ type: string }>();
  const searchParams = useSearchParams();
  const routeType = params.type;
  const sport = searchParams.get("sport");

  const template = useMemo<CardioTemplate | null>(
    () => CARDIO_TEMPLATES.find((t) => t.id === routeType) || null,
    [routeType]
  );

  const baseType = template?.type === "sprint" ? "running" : template?.type || routeType;
  const meta = CARDIO_META[baseType] || { name: baseType, icon: "🏃", hasGPS: false, hasIntervals: false };

  const [phase, setPhase] = useState<"preview" | "setup" | "tracking" | "done">(
    template ? "preview" : meta.hasIntervals ? "setup" : "tracking"
  );
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  const [saving, setSaving] = useState(false);
  const [hiitConfig, setHiitConfig] = useState<HIITConfig | null>(null);

  const [currentIntervalIdx, setCurrentIntervalIdx] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [intervalTimeLeft, setIntervalTimeLeft] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const watchRef = useRef<number | undefined>(undefined);
  const lastPositionRef = useRef<[number, number] | null>(null);
  const routeRef = useRef<[number, number][]>([]);

  useEffect(() => {
    if (template?.intervals?.length) {
      const mapped: HIITConfig = {
        rounds: 1,
        intervals: template.intervals.map((i) => ({
          type: i.label.toLowerCase().includes("rest") ? "rest" : "work",
          duration: parseDurationToSeconds(i.work),
          name: `${i.label}${i.reps > 1 ? ` x${i.reps}` : ""}`,
        })),
      };
      setHiitConfig(mapped);
    }
  }, [template]);

  const caloriesPerSecond = distance > 0 ? 100 / 1609 : 0.2;

  const tick = useCallback(() => {
    setDuration((d) => d + 1);
    setCalories((c) => c + caloriesPerSecond);

    if (hiitConfig) {
      setIntervalTimeLeft((t) => {
        if (t <= 1) {
          const allIntervals = hiitConfig.intervals;
          setCurrentIntervalIdx((idx) => {
            const next = idx + 1;
            if (next >= allIntervals.length) {
              setCurrentRound((r) => {
                if (r >= hiitConfig.rounds) {
                  setIsRunning(false);
                  return r;
                }
                setCurrentIntervalIdx(0);
                setIntervalTimeLeft(allIntervals[0].duration);
                return r + 1;
              });
              return idx;
            }
            setIntervalTimeLeft(allIntervals[next].duration);
            return next;
          });
          return 0;
        }
        return t - 1;
      });
    }
  }, [hiitConfig, caloriesPerSecond]);

  useEffect(() => {
    if (isRunning) timerRef.current = setInterval(tick, 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [isRunning, tick]);

  useEffect(() => {
    if (isRunning && meta.hasGPS && navigator.geolocation) {
      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const point: [number, number] = [latitude, longitude];
          routeRef.current.push(point);
          if (lastPositionRef.current) {
            const [lat1, lon1] = lastPositionRef.current;
            const R = 3958.8;
            const dLat = ((latitude - lat1) * Math.PI) / 180;
            const dLon = ((longitude - lon1) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) ** 2 +
              Math.cos((lat1 * Math.PI) / 180) * Math.cos((latitude * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
            const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            setDistance((prev) => prev + d);
          }
          lastPositionRef.current = point;
        },
        undefined,
        { enableHighAccuracy: true }
      );
    }
    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [isRunning, meta.hasGPS]);

  function startGuided() {
    if (hiitConfig?.intervals?.length) {
      setCurrentRound(1);
      setCurrentIntervalIdx(0);
      setIntervalTimeLeft(hiitConfig.intervals[0].duration);
    }
    setPhase("tracking");
    setIsRunning(true);
  }

  function handleStartHIIT(config: HIITConfig) {
    setHiitConfig(config);
    setCurrentRound(1);
    setCurrentIntervalIdx(0);
    setIntervalTimeLeft(config.intervals[0].duration);
    setPhase("tracking");
    setIsRunning(true);
  }

  async function handleFinish() {
    setIsRunning(false);
    setSaving(true);

    const paceVal = distance > 0 && duration > 0 ? (duration / 60) / distance : null;
    await fetch("/api/cardio/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: template?.type || routeType,
        sport: sport || null,
        title: template?.title || null,
        description: template?.description || null,
        duration,
        distance: distance || null,
        pace: paceVal,
        calories: Math.round(calories),
        routeData: routeRef.current.length > 0 ? routeRef.current : null,
        intervals: hiitConfig || null,
      }),
    });

    setSaving(false);
    setPhase("done");
  }

  if (phase === "preview" && template) {
    return (
      <main className="min-h-screen bg-black text-white p-5 pb-8">
        <button onClick={() => router.back()} className="text-neutral-400 text-sm">
          ← Back
        </button>
        <div className="mt-4 rounded-2xl border border-[#262626] bg-[#141414] p-5">
          <p className="text-xs text-neutral-500 uppercase tracking-wider">Guided Cardio</p>
          <h1 className="mt-2 text-2xl font-bold">
            {meta.icon} {template.title}
          </h1>
          <div className="mt-2 text-sm text-neutral-400">
            {template.duration} min · <span className="capitalize">{template.intensity}</span>
          </div>
          <p className="text-sm text-neutral-300 mt-4 leading-relaxed">{template.description}</p>

          {template.intervals?.length ? (
            <div className="mt-5 space-y-2">
              <p className="text-xs text-neutral-500 uppercase tracking-wider">Workout Structure</p>
              {template.intervals.map((it, idx) => (
                <div key={`${it.label}-${idx}`} className="rounded-xl bg-[#0f0f0f] border border-[#262626] p-3 text-sm">
                  <p className="font-semibold">{it.label}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Work: {it.work} · Rest: {it.rest} · Reps: {it.reps}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          <button onClick={startGuided} className="mt-6 w-full py-3 rounded-xl bg-[#0066FF] font-semibold">
            Start Guided Session
          </button>
        </div>
      </main>
    );
  }

  if (phase === "setup" && meta.hasIntervals) {
    return (
      <main className="min-h-screen bg-black text-white">
        <header className="px-5 pt-8 pb-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-neutral-400 text-sm">
            ← Back
          </button>
          <h1 className="font-bold">
            {meta.icon} {meta.name}
          </h1>
        </header>
        <HIITBuilder onStart={handleStartHIIT} />
      </main>
    );
  }

  if (phase === "done") {
    const paceVal = distance > 0 && duration > 0 ? (duration / 60) / distance : 0;
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-1">{template?.title || meta.name} Complete</h2>
        <p className="text-neutral-500 text-sm mb-8">Great work. Here is your summary.</p>

        <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-8">
          <StatBox label="Duration" value={formatTime(duration)} unit="" />
          {distance > 0 && <StatBox label="Distance" value={distance.toFixed(2)} unit="mi" />}
          {distance > 0 && paceVal > 0 && <StatBox label="Avg Pace" value={formatPace(paceVal)} unit="/mi" />}
          <StatBox label="Calories" value={Math.round(calories)} unit="cal" />
        </div>

        <button onClick={() => router.push("/workout")} className="w-full max-w-sm py-4 bg-[#0066FF] text-white font-bold rounded-xl">
          Done
        </button>
      </main>
    );
  }

  const pace = distance > 0 && duration > 0 ? (duration / 60) / distance : 0;
  const currentInterval = hiitConfig?.intervals[currentIntervalIdx];

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <header className="px-5 pt-8 pb-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-neutral-400 text-sm">
          ← Back
        </button>
        <h1 className="font-bold">
          {meta.icon} {sport || template?.title || meta.name}
        </h1>
        <div className="w-10" />
      </header>

      {hiitConfig && currentInterval && (
        <div
          className={`mx-5 mb-2 rounded-xl p-3 text-center ${
            currentInterval.type === "work"
              ? "bg-red-900/30 border border-red-900/40"
              : "bg-green-900/30 border border-green-900/40"
          }`}
        >
          <p className={`font-bold text-lg ${currentInterval.type === "work" ? "text-red-400" : "text-[#00C853]"}`}>
            {currentInterval.name}
          </p>
          <p className="text-3xl font-mono font-bold">{intervalTimeLeft}s</p>
          <p className="text-xs text-neutral-500 mt-1">
            Round {currentRound} / {hiitConfig.rounds}
          </p>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-5 space-y-6">
        <div className="text-7xl font-bold font-mono tracking-tight">{formatTime(duration)}</div>

        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {meta.hasGPS && <StatBox label="Distance" value={distance.toFixed(2)} unit="mi" />}
          {meta.hasGPS && <StatBox label="Pace" value={pace > 0 ? formatPace(pace) : "--:--"} unit="/mi" />}
          <StatBox label="Calories" value={Math.round(calories)} unit="cal" />
          <StatBox label="Time" value={formatTime(duration)} unit="" />
        </div>
      </div>

      <div className="px-5 pb-10 space-y-3">
        {isRunning ? (
          <button onClick={() => setIsRunning(false)} className="w-full py-4 bg-[#FFB300] text-black font-bold rounded-xl text-lg">
            Pause
          </button>
        ) : duration === 0 ? (
          <button onClick={() => setIsRunning(true)} className="w-full py-4 bg-[#00C853] text-black font-bold rounded-xl text-lg">
            Start {template?.title || meta.name}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setIsRunning(true)} className="py-4 bg-[#00C853] text-black font-bold rounded-xl">
              Resume
            </button>
            <button onClick={handleFinish} disabled={saving} className="py-4 bg-[#0066FF] text-white font-bold rounded-xl disabled:opacity-50">
              {saving ? "Saving..." : "Finish"}
            </button>
          </div>
        )}
        {isRunning && duration > 10 && (
          <button onClick={handleFinish} disabled={saving} className="w-full py-3 border border-[#262626] text-neutral-400 rounded-xl text-sm">
            End Session
          </button>
        )}
      </div>
    </main>
  );
}

function parseDurationToSeconds(value: string): number {
  const raw = value.trim().toLowerCase();
  const minutesMatch = raw.match(/(\d+)\s*min/);
  if (minutesMatch) return Number(minutesMatch[1]) * 60;
  const secMatch = raw.match(/(\d+)\s*(sec|s)/);
  if (secMatch) return Number(secMatch[1]);
  const meterMatch = raw.match(/(\d+)\s*m/);
  if (meterMatch) return Math.max(30, Math.round(Number(meterMatch[1]) / 3.5));
  const plain = Number(raw);
  return Number.isFinite(plain) && plain > 0 ? plain : 60;
}
