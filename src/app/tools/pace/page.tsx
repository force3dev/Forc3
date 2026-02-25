"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/shared/BottomNav";

type Mode = "pace" | "time";
type DistanceUnit = "km" | "mi";

const RACE_DISTANCES: { label: string; km: number }[] = [
  { label: "1K", km: 1 },
  { label: "5K", km: 5 },
  { label: "10K", km: 10 },
  { label: "Half Marathon", km: 21.0975 },
  { label: "Marathon", km: 42.195 },
];

function formatTime(totalSeconds: number): string {
  if (!isFinite(totalSeconds) || totalSeconds <= 0) return "--:--";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.round(totalSeconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatPace(secondsPerUnit: number): string {
  if (!isFinite(secondsPerUnit) || secondsPerUnit <= 0) return "--:--";
  const m = Math.floor(secondsPerUnit / 60);
  const s = Math.round(secondsPerUnit % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PaceCalculatorPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("pace");
  const [distUnit, setDistUnit] = useState<DistanceUnit>("km");

  // Distance & Time -> Pace mode
  const [distance, setDistance] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");

  // Pace & Distance -> Time mode
  const [paceMin, setPaceMin] = useState("");
  const [paceSec, setPaceSec] = useState("");
  const [timeDistance, setTimeDistance] = useState("");

  const [calculated, setCalculated] = useState(false);

  // Pace mode results
  const paceResults = useMemo(() => {
    const dist = parseFloat(distance) || 0;
    const totalSec = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
    if (dist <= 0 || totalSec <= 0) return null;

    const distKm = distUnit === "km" ? dist : dist * 1.60934;
    const distMi = distUnit === "mi" ? dist : dist / 1.60934;

    const pacePerKm = totalSec / distKm;
    const pacePerMi = totalSec / distMi;
    const speedKph = (distKm / totalSec) * 3600;
    const speedMph = (distMi / totalSec) * 3600;

    // Training paces based on calculated pace (using Jack Daniels-inspired zones)
    const basePacePerKm = pacePerKm;
    const zones = [
      { name: "Easy / Recovery", factor: 1.25, color: "#00C853" },
      { name: "Tempo / Threshold", factor: 1.0, color: "#FFB300" },
      { name: "Threshold", factor: 0.95, color: "#FF9100" },
      { name: "Interval (VO2max)", factor: 0.88, color: "#FF5252" },
    ];

    // Split times
    const splitKm = pacePerKm;
    const splitMi = pacePerMi;

    return {
      pacePerKm,
      pacePerMi,
      speedKph,
      speedMph,
      totalSec,
      zones: zones.map((z) => ({
        ...z,
        pacePerKm: formatPace(basePacePerKm * z.factor),
        pacePerMi: formatPace((basePacePerKm * z.factor) * 1.60934),
      })),
      splitKm,
      splitMi,
    };
  }, [distance, hours, minutes, seconds, distUnit]);

  // Time mode results
  const timeResults = useMemo(() => {
    const paceSeconds = (parseInt(paceMin) || 0) * 60 + (parseInt(paceSec) || 0);
    const dist = parseFloat(timeDistance) || 0;
    if (paceSeconds <= 0 || dist <= 0) return null;

    const totalSec = paceSeconds * dist;
    return { totalSec };
  }, [paceMin, paceSec, timeDistance]);

  function handleRaceQuickButton(km: number) {
    if (mode === "pace") {
      setDistance(distUnit === "km" ? km.toFixed(2) : (km / 1.60934).toFixed(2));
    } else {
      setTimeDistance(distUnit === "km" ? km.toFixed(2) : (km / 1.60934).toFixed(2));
    }
    setCalculated(false);
  }

  function handleCalculate() {
    setCalculated(true);
  }

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-[#1a1a1a]">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#141414] border border-[#262626] text-neutral-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Pace Calculator</h1>
              <p className="text-xs text-neutral-500">Splits & training zones</p>
            </div>
          </div>
          <span className="text-xs font-black tracking-[0.2em] text-[#0066FF]">FORC3</span>
        </div>
      </header>

      <div className="px-5 pt-5 space-y-4 max-w-lg mx-auto">
        {/* Mode Toggle */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-1.5 flex">
          <button
            onClick={() => { setMode("pace"); setCalculated(false); }}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
              mode === "pace" ? "bg-[#0066FF] text-white" : "text-neutral-400"
            }`}
          >
            Distance & Time &rarr; Pace
          </button>
          <button
            onClick={() => { setMode("time"); setCalculated(false); }}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
              mode === "time" ? "bg-[#0066FF] text-white" : "text-neutral-400"
            }`}
          >
            Pace & Distance &rarr; Time
          </button>
        </div>

        {/* Unit Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Distance unit:</span>
          <button
            onClick={() => setDistUnit(distUnit === "km" ? "mi" : "km")}
            className="bg-[#141414] border border-[#262626] rounded-lg px-3 py-1.5 text-xs font-semibold text-[#0066FF] transition-colors"
          >
            {distUnit === "km" ? "Kilometers" : "Miles"}
          </button>
        </div>

        {/* Race Quick Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {RACE_DISTANCES.map((race) => (
            <button
              key={race.label}
              onClick={() => handleRaceQuickButton(race.km)}
              className="flex-shrink-0 bg-[#141414] border border-[#262626] rounded-full px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white hover:border-[#0066FF]/40 transition-colors active:scale-95"
            >
              {race.label}
            </button>
          ))}
        </div>

        {mode === "pace" ? (
          /* Pace Mode Inputs */
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-4">
            <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Input</p>

            {/* Distance */}
            <div>
              <label className="text-xs text-neutral-500 mb-1.5 block">Distance ({distUnit})</label>
              <input
                type="number"
                step="0.01"
                value={distance}
                onChange={(e) => { setDistance(e.target.value); setCalculated(false); }}
                placeholder={`e.g. ${distUnit === "km" ? "5" : "3.1"}`}
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white font-semibold focus:outline-none focus:border-[#0066FF]/50 placeholder-neutral-700"
              />
            </div>

            {/* Time */}
            <div>
              <label className="text-xs text-neutral-500 mb-1.5 block">Time</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input
                    type="number"
                    value={hours}
                    onChange={(e) => { setHours(e.target.value); setCalculated(false); }}
                    placeholder="0"
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white font-semibold text-center focus:outline-none focus:border-[#0066FF]/50 placeholder-neutral-700"
                  />
                  <p className="text-[10px] text-neutral-600 text-center mt-1">hours</p>
                </div>
                <div>
                  <input
                    type="number"
                    value={minutes}
                    onChange={(e) => { setMinutes(e.target.value); setCalculated(false); }}
                    placeholder="25"
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white font-semibold text-center focus:outline-none focus:border-[#0066FF]/50 placeholder-neutral-700"
                  />
                  <p className="text-[10px] text-neutral-600 text-center mt-1">min</p>
                </div>
                <div>
                  <input
                    type="number"
                    value={seconds}
                    onChange={(e) => { setSeconds(e.target.value); setCalculated(false); }}
                    placeholder="00"
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white font-semibold text-center focus:outline-none focus:border-[#0066FF]/50 placeholder-neutral-700"
                  />
                  <p className="text-[10px] text-neutral-600 text-center mt-1">sec</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Time Mode Inputs */
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-4">
            <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Input</p>

            {/* Pace */}
            <div>
              <label className="text-xs text-neutral-500 mb-1.5 block">Pace (per {distUnit})</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="number"
                    value={paceMin}
                    onChange={(e) => { setPaceMin(e.target.value); setCalculated(false); }}
                    placeholder="5"
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white font-semibold text-center focus:outline-none focus:border-[#0066FF]/50 placeholder-neutral-700"
                  />
                  <p className="text-[10px] text-neutral-600 text-center mt-1">min</p>
                </div>
                <div>
                  <input
                    type="number"
                    value={paceSec}
                    onChange={(e) => { setPaceSec(e.target.value); setCalculated(false); }}
                    placeholder="00"
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white font-semibold text-center focus:outline-none focus:border-[#0066FF]/50 placeholder-neutral-700"
                  />
                  <p className="text-[10px] text-neutral-600 text-center mt-1">sec</p>
                </div>
              </div>
            </div>

            {/* Distance */}
            <div>
              <label className="text-xs text-neutral-500 mb-1.5 block">Distance ({distUnit})</label>
              <input
                type="number"
                step="0.01"
                value={timeDistance}
                onChange={(e) => { setTimeDistance(e.target.value); setCalculated(false); }}
                placeholder={`e.g. ${distUnit === "km" ? "10" : "6.2"}`}
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white font-semibold focus:outline-none focus:border-[#0066FF]/50 placeholder-neutral-700"
              />
            </div>
          </div>
        )}

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          className="w-full py-4 bg-[#0066FF] text-white font-bold rounded-2xl text-sm active:scale-[0.98] transition-transform"
        >
          Calculate
        </button>

        {/* Results */}
        <AnimatePresence>
          {calculated && mode === "pace" && paceResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Pace Result */}
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
                <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-4">Your Pace</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-3xl font-black text-[#0066FF]">{formatPace(paceResults.pacePerKm)}</p>
                    <p className="text-xs text-neutral-500 mt-1">min/km</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-[#FFB300]">{formatPace(paceResults.pacePerMi)}</p>
                    <p className="text-xs text-neutral-500 mt-1">min/mi</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#262626]">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{paceResults.speedKph.toFixed(1)}</p>
                    <p className="text-xs text-neutral-500">km/h</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{paceResults.speedMph.toFixed(1)}</p>
                    <p className="text-xs text-neutral-500">mph</p>
                  </div>
                </div>
              </div>

              {/* Split Times */}
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
                <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-3">Split Times</p>
                <div className="space-y-2">
                  {RACE_DISTANCES.map((race) => {
                    const raceSec = paceResults.pacePerKm * race.km;
                    return (
                      <div key={race.label} className="flex items-center justify-between text-sm">
                        <span className="text-neutral-400">{race.label}</span>
                        <span className="font-bold text-white font-mono">{formatTime(raceSec)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Training Zones */}
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
                <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-3">Training Paces</p>
                <div className="space-y-3">
                  {paceResults.zones.map((zone) => (
                    <div key={zone.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zone.color }} />
                        <span className="text-sm text-neutral-300">{zone.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-white font-mono">{zone.pacePerKm}</span>
                        <span className="text-xs text-neutral-500 ml-1">/km</span>
                        <span className="text-xs text-neutral-600 ml-2">{zone.pacePerMi}/mi</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {calculated && mode === "time" && timeResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 text-center">
                <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-4">Estimated Finish Time</p>
                <p className="text-4xl font-black text-[#0066FF]">{formatTime(timeResults.totalSec)}</p>
                <p className="text-sm text-neutral-500 mt-2">
                  {timeDistance} {distUnit} at {paceMin}:{String(parseInt(paceSec) || 0).padStart(2, "0")} /{distUnit}
                </p>
              </div>
            </motion.div>
          )}

          {calculated && (
            (mode === "pace" && !paceResults) || (mode === "time" && !timeResults)
          ) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#141414] border border-[#262626] rounded-2xl p-8 text-center"
            >
              <p className="text-neutral-500 text-sm">Please fill in all fields to see results.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav active="home" />
    </main>
  );
}
