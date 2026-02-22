"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HIITBuilder } from "@/components/cardio/HIITBuilder";

const CARDIO_META: Record<string, { name: string; icon: string; hasGPS: boolean; hasIntervals: boolean }> = {
  running:       { name: "Running",       icon: "🏃", hasGPS: true,  hasIntervals: false },
  cycling:       { name: "Cycling",       icon: "🚴", hasGPS: true,  hasIntervals: false },
  swimming:      { name: "Swimming",      icon: "🏊", hasGPS: false, hasIntervals: false },
  hiit:          { name: "HIIT",          icon: "⚡", hasGPS: false, hasIntervals: true  },
  rowing:        { name: "Rowing",        icon: "🚣", hasGPS: false, hasIntervals: false },
  jump_rope:     { name: "Jump Rope",     icon: "🪢", hasGPS: false, hasIntervals: false },
  elliptical:    { name: "Elliptical",    icon: "🔄", hasGPS: false, hasIntervals: false },
  walking:       { name: "Walking",       icon: "🚶", hasGPS: true,  hasIntervals: false },
  stair_climber: { name: "Stair Climber", icon: "🪜", hasGPS: false, hasIntervals: false },
  sports:        { name: "Sports",        icon: "⚽", hasGPS: false, hasIntervals: false },
};

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

interface HIITConfig {
  intervals: { type: "work" | "rest"; duration: number; name: string }[];
  rounds: number;
}

export default function CardioTrackingPage({ params, searchParams }: {
  params: { type: string };
  searchParams: { sport?: string };
}) {
  const router = useRouter();
  const meta = CARDIO_META[params.type] || { name: params.type, icon: "🏃", hasGPS: false, hasIntervals: false };
  const sport = searchParams.sport;

  const [phase, setPhase] = useState<"setup" | "tracking" | "done">(
    meta.hasIntervals ? "setup" : "tracking"
  );
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  const [hiitConfig, setHiitConfig] = useState<HIITConfig | null>(null);
  const [saving, setSaving] = useState(false);

  // HIIT interval tracking
  const [currentIntervalIdx, setCurrentIntervalIdx] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [intervalTimeLeft, setIntervalTimeLeft] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const watchRef = useRef<number | undefined>(undefined);
  const lastPositionRef = useRef<[number, number] | null>(null);
  const routeRef = useRef<[number, number][]>([]);

  const caloriesPerSecond = (distance > 0 ? 100 / 1609 : 0.2); // rough estimate

  const tick = useCallback(() => {
    setDuration(d => d + 1);
    setCalories(c => c + caloriesPerSecond);

    if (hiitConfig) {
      setIntervalTimeLeft(t => {
        if (t <= 1) {
          // Advance interval
          const allIntervals = hiitConfig.intervals;
          setCurrentIntervalIdx(idx => {
            const next = idx + 1;
            if (next >= allIntervals.length) {
              setCurrentRound(r => {
                if (r >= hiitConfig.rounds) {
                  setIsRunning(false);
                  return r;
                }
                setCurrentIntervalIdx(0);
                setIntervalTimeLeft(allIntervals[0].duration);
                return r + 1;
              });
              return idx; // will be reset
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
    if (isRunning) {
      timerRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, tick]);

  // GPS tracking
  useEffect(() => {
    if (isRunning && meta.hasGPS && navigator.geolocation) {
      watchRef.current = navigator.geolocation.watchPosition(
        pos => {
          const { latitude, longitude } = pos.coords;
          const point: [number, number] = [latitude, longitude];
          routeRef.current.push(point);

          if (lastPositionRef.current) {
            const [lat1, lon1] = lastPositionRef.current;
            // Haversine distance in miles
            const R = 3958.8;
            const dLat = ((latitude - lat1) * Math.PI) / 180;
            const dLon = ((longitude - lon1) * Math.PI) / 180;
            const a = Math.sin(dLat / 2) ** 2 +
              Math.cos((lat1 * Math.PI) / 180) * Math.cos((latitude * Math.PI) / 180) *
              Math.sin(dLon / 2) ** 2;
            const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            setDistance(prev => prev + d);
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

  const handleStartHIIT = (config: HIITConfig) => {
    setHiitConfig(config);
    setIntervalTimeLeft(config.intervals[0].duration);
    setCurrentIntervalIdx(0);
    setCurrentRound(1);
    setPhase("tracking");
    setIsRunning(true);
  };

  const handleFinish = async () => {
    setIsRunning(false);
    setSaving(true);

    const paceVal = distance > 0 && duration > 0 ? (duration / 60) / distance : null;

    await fetch("/api/cardio/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: params.type,
        sport: sport || null,
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
  };

  if (phase === "setup" && meta.hasIntervals) {
    return (
      <main className="min-h-screen bg-black text-white">
        <header className="px-5 pt-8 pb-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-neutral-400 text-sm">← Back</button>
          <h1 className="font-bold">{meta.icon} {meta.name}</h1>
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
        <h2 className="text-2xl font-bold mb-1">{meta.name} Complete!</h2>
        <p className="text-neutral-500 text-sm mb-8">Great work. Here&apos;s your summary:</p>

        <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-8">
          <StatBox label="Duration" value={formatTime(duration)} unit="" />
          {distance > 0 && <StatBox label="Distance" value={distance.toFixed(2)} unit="mi" />}
          {distance > 0 && paceVal > 0 && <StatBox label="Avg Pace" value={formatPace(paceVal)} unit="/mi" />}
          <StatBox label="Calories" value={Math.round(calories)} unit="cal" />
        </div>

        <button
          onClick={() => router.push("/workout")}
          className="w-full max-w-sm py-4 bg-[#0066FF] text-white font-bold rounded-xl hover:bg-[#0052CC] transition-colors"
        >
          Done
        </button>
      </main>
    );
  }

  // Tracking phase
  const pace = distance > 0 && duration > 0 ? (duration / 60) / distance : 0;
  const currentInterval = hiitConfig?.intervals[currentIntervalIdx];

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <header className="px-5 pt-8 pb-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-neutral-400 text-sm">← Back</button>
        <h1 className="font-bold">{meta.icon} {sport || meta.name}</h1>
        <div className="w-10" />
      </header>

      {/* HIIT Interval Banner */}
      {hiitConfig && currentInterval && (
        <div className={`mx-5 mb-2 rounded-xl p-3 text-center ${
          currentInterval.type === "work" ? "bg-red-900/30 border border-red-900/40" : "bg-green-900/30 border border-green-900/40"
        }`}>
          <p className={`font-bold text-lg ${currentInterval.type === "work" ? "text-red-400" : "text-[#00C853]"}`}>
            {currentInterval.name}
          </p>
          <p className="text-3xl font-mono font-bold">{intervalTimeLeft}s</p>
          <p className="text-xs text-neutral-500 mt-1">Round {currentRound} / {hiitConfig.rounds}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-5 space-y-6">
        {/* Timer */}
        <div className="text-7xl font-bold font-mono tracking-tight">
          {formatTime(duration)}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {meta.hasGPS && (
            <StatBox label="Distance" value={distance.toFixed(2)} unit="mi" />
          )}
          {meta.hasGPS && (
            <StatBox label="Pace" value={pace > 0 ? formatPace(pace) : "--:--"} unit="/mi" />
          )}
          <StatBox label="Calories" value={Math.round(calories)} unit="cal" />
          <StatBox label="Time" value={formatTime(duration)} unit="" />
        </div>
      </div>

      {/* Controls */}
      <div className="px-5 pb-10 space-y-3">
        {isRunning ? (
          <button
            onClick={() => setIsRunning(false)}
            className="w-full py-4 bg-[#FFB300] text-black font-bold rounded-xl text-lg hover:bg-[#FFA000] transition-colors"
          >
            Pause
          </button>
        ) : duration === 0 ? (
          <button
            onClick={() => setIsRunning(true)}
            className="w-full py-4 bg-[#00C853] text-black font-bold rounded-xl text-lg hover:bg-[#00a844] transition-colors"
          >
            Start {meta.name}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setIsRunning(true)}
              className="py-4 bg-[#00C853] text-black font-bold rounded-xl hover:bg-[#00a844] transition-colors"
            >
              Resume
            </button>
            <button
              onClick={handleFinish}
              disabled={saving}
              className="py-4 bg-[#0066FF] text-white font-bold rounded-xl hover:bg-[#0052CC] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Finish"}
            </button>
          </div>
        )}
        {isRunning && duration > 10 && (
          <button
            onClick={handleFinish}
            disabled={saving}
            className="w-full py-3 border border-[#262626] text-neutral-400 rounded-xl text-sm hover:border-red-500/50 hover:text-red-400 transition-colors"
          >
            End Session
          </button>
        )}
      </div>
    </main>
  );
}
