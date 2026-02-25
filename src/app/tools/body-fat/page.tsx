"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/shared/BottomNav";

type Gender = "M" | "F";
type MeasurementUnit = "in" | "cm";

function calculateNavyBodyFat(gender: Gender, waist: number, neck: number, height: number, hip: number): number {
  // U.S. Navy circumference method (all values in cm)
  if (gender === "M") {
    const bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
    return Math.max(0, Math.round(bf * 10) / 10);
  }
  const bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
  return Math.max(0, Math.round(bf * 10) / 10);
}

function getCategory(gender: Gender, bf: number): { label: string; color: string } {
  if (gender === "M") {
    if (bf < 6) return { label: "Essential Fat", color: "#FF5252" };
    if (bf < 14) return { label: "Athletes", color: "#0066FF" };
    if (bf < 18) return { label: "Fitness", color: "#00C853" };
    if (bf < 25) return { label: "Average", color: "#FFB300" };
    return { label: "Above Average", color: "#FF5252" };
  }
  if (bf < 14) return { label: "Essential Fat", color: "#FF5252" };
  if (bf < 21) return { label: "Athletes", color: "#0066FF" };
  if (bf < 25) return { label: "Fitness", color: "#00C853" };
  if (bf < 32) return { label: "Average", color: "#FFB300" };
  return { label: "Above Average", color: "#FF5252" };
}

export default function BodyFatCalculatorPage() {
  const router = useRouter();

  const [gender, setGender] = useState<Gender>("M");
  const [unit, setUnit] = useState<MeasurementUnit>("in");
  const [height, setHeight] = useState("");
  const [waist, setWaist] = useState("");
  const [neck, setNeck] = useState("");
  const [hip, setHip] = useState("");
  const [calculated, setCalculated] = useState(false);

  const toCm = (val: string) => {
    const n = parseFloat(val) || 0;
    return unit === "cm" ? n : n * 2.54;
  };

  const heightCm = toCm(height);
  const waistCm = toCm(waist);
  const neckCm = toCm(neck);
  const hipCm = toCm(hip);

  const canCalculate = heightCm > 0 && waistCm > 0 && neckCm > 0 && (gender === "M" || hipCm > 0) && waistCm > neckCm;

  const bodyFat = canCalculate ? calculateNavyBodyFat(gender, waistCm, neckCm, heightCm, hipCm) : 0;
  const category = canCalculate ? getCategory(gender, bodyFat) : null;

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
              <h1 className="text-lg font-bold tracking-tight">Body Fat Calculator</h1>
              <p className="text-xs text-neutral-500">U.S. Navy method</p>
            </div>
          </div>
          <span className="text-xs font-black tracking-[0.2em] text-[#0066FF]">FORC3</span>
        </div>
      </header>

      <div className="px-5 pt-5 space-y-4 max-w-lg mx-auto">
        {/* Gender & Units */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-4">
          <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Settings</p>

          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block">Gender</label>
            <div className="grid grid-cols-2 gap-2">
              {(["M", "F"] as Gender[]).map((g) => (
                <button
                  key={g}
                  onClick={() => { setGender(g); setCalculated(false); }}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                    gender === g ? "bg-[#0066FF] text-white" : "bg-[#0a0a0a] border border-[#262626] text-neutral-400"
                  }`}
                >
                  {g === "M" ? "Male" : "Female"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block">Measurement Unit</label>
            <div className="grid grid-cols-2 gap-2">
              {(["in", "cm"] as MeasurementUnit[]).map((u) => (
                <button
                  key={u}
                  onClick={() => { setUnit(u); setCalculated(false); }}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                    unit === u ? "bg-[#0066FF] text-white" : "bg-[#0a0a0a] border border-[#262626] text-neutral-400"
                  }`}
                >
                  {u === "in" ? "Inches" : "Centimeters"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Measurements */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-4">
          <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Measurements</p>

          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block">Height ({unit})</label>
            <input
              type="number"
              step="0.1"
              value={height}
              onChange={(e) => { setHeight(e.target.value); setCalculated(false); }}
              placeholder={unit === "in" ? "e.g. 70" : "e.g. 178"}
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white font-semibold focus:outline-none focus:border-[#0066FF]/50 placeholder-neutral-700"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block">Neck circumference ({unit})</label>
            <input
              type="number"
              step="0.1"
              value={neck}
              onChange={(e) => { setNeck(e.target.value); setCalculated(false); }}
              placeholder={unit === "in" ? "e.g. 15" : "e.g. 38"}
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white font-semibold focus:outline-none focus:border-[#0066FF]/50 placeholder-neutral-700"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block">Waist circumference ({unit})</label>
            <input
              type="number"
              step="0.1"
              value={waist}
              onChange={(e) => { setWaist(e.target.value); setCalculated(false); }}
              placeholder={unit === "in" ? "e.g. 33" : "e.g. 84"}
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white font-semibold focus:outline-none focus:border-[#0066FF]/50 placeholder-neutral-700"
            />
            <p className="text-[10px] text-neutral-600 mt-1">Measure at navel level</p>
          </div>

          {gender === "F" && (
            <div>
              <label className="text-xs text-neutral-500 mb-1.5 block">Hip circumference ({unit})</label>
              <input
                type="number"
                step="0.1"
                value={hip}
                onChange={(e) => { setHip(e.target.value); setCalculated(false); }}
                placeholder={unit === "in" ? "e.g. 38" : "e.g. 97"}
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white font-semibold focus:outline-none focus:border-[#0066FF]/50 placeholder-neutral-700"
              />
              <p className="text-[10px] text-neutral-600 mt-1">Measure at widest point</p>
            </div>
          )}
        </div>

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          disabled={!canCalculate}
          className="w-full py-4 bg-[#0066FF] text-white font-bold rounded-2xl text-sm active:scale-[0.98] transition-transform disabled:opacity-40 disabled:active:scale-100"
        >
          Calculate Body Fat %
        </button>

        {/* Results */}
        <AnimatePresence>
          {calculated && canCalculate && category && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 text-center">
                <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-4">Estimated Body Fat</p>
                <p className="text-5xl font-black" style={{ color: category.color }}>
                  {bodyFat}<span className="text-2xl text-neutral-400">%</span>
                </p>
                <div
                  className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: `${category.color}20`, color: category.color }}
                >
                  {category.label}
                </div>
              </div>

              {/* Reference Ranges */}
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
                <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-3">
                  {gender === "M" ? "Male" : "Female"} Reference Ranges
                </p>
                <div className="space-y-2">
                  {(gender === "M"
                    ? [
                        { label: "Essential Fat", range: "2-5%", color: "#FF5252" },
                        { label: "Athletes", range: "6-13%", color: "#0066FF" },
                        { label: "Fitness", range: "14-17%", color: "#00C853" },
                        { label: "Average", range: "18-24%", color: "#FFB300" },
                        { label: "Above Average", range: "25%+", color: "#FF5252" },
                      ]
                    : [
                        { label: "Essential Fat", range: "10-13%", color: "#FF5252" },
                        { label: "Athletes", range: "14-20%", color: "#0066FF" },
                        { label: "Fitness", range: "21-24%", color: "#00C853" },
                        { label: "Average", range: "25-31%", color: "#FFB300" },
                        { label: "Above Average", range: "32%+", color: "#FF5252" },
                      ]
                  ).map((row) => (
                    <div
                      key={row.label}
                      className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg ${
                        category.label === row.label ? "bg-white/5" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                        <span className={category.label === row.label ? "text-white font-semibold" : "text-neutral-400"}>
                          {row.label}
                        </span>
                      </div>
                      <span className={`font-mono text-xs ${category.label === row.label ? "text-white font-bold" : "text-neutral-500"}`}>
                        {row.range}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-neutral-600 text-center px-4 leading-relaxed">
                This is an estimate using the U.S. Navy circumference method. For more accurate results, consider DEXA scanning or hydrostatic weighing.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav active="home" />
    </main>
  );
}
