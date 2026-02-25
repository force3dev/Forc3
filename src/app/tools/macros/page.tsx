"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/shared/BottomNav";

type Gender = "M" | "F";
type Goal = "lose_fat" | "maintain" | "build_muscle";
type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
type HeightUnit = "cm" | "ft";
type WeightUnit = "kg" | "lbs";

const ACTIVITY_LEVELS: { key: ActivityLevel; label: string; multiplier: number; desc: string }[] = [
  { key: "sedentary", label: "Sedentary", multiplier: 1.2, desc: "Desk job, little exercise" },
  { key: "light", label: "Light", multiplier: 1.375, desc: "1-3 days/week" },
  { key: "moderate", label: "Moderate", multiplier: 1.55, desc: "3-5 days/week" },
  { key: "active", label: "Active", multiplier: 1.725, desc: "6-7 days/week" },
  { key: "very_active", label: "Very Active", multiplier: 1.9, desc: "Athlete / 2x/day" },
];

const GOALS: { key: Goal; label: string; icon: string; calorieAdjust: number; proteinMult: number }[] = [
  { key: "lose_fat", label: "Lose Fat", icon: "🔥", calorieAdjust: -0.2, proteinMult: 2.4 },
  { key: "maintain", label: "Maintain", icon: "⚖️", calorieAdjust: 0, proteinMult: 2.0 },
  { key: "build_muscle", label: "Build Muscle", icon: "💪", calorieAdjust: 0.1, proteinMult: 2.2 },
];

function calculateBMR(gender: Gender, weightKg: number, heightCm: number, age: number): number {
  if (gender === "M") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

function ProgressRing({ percent, color, size = 72, strokeWidth = 5, children }: {
  percent: number; color: string; size?: number; strokeWidth?: number; children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#262626" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export default function MacroCalculatorPage() {
  const router = useRouter();

  // Inputs
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState<Gender>("M");
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");
  const [heightCm, setHeightCm] = useState(175);
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(9);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [weightValue, setWeightValue] = useState(75);
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<Goal>("maintain");

  // State
  const [calculated, setCalculated] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  // Derived values
  const heightInCm = heightUnit === "cm" ? heightCm : (heightFt * 30.48 + heightIn * 2.54);
  const weightInKg = weightUnit === "kg" ? weightValue : weightValue * 0.453592;

  const activityData = ACTIVITY_LEVELS.find((a) => a.key === activity)!;
  const goalData = GOALS.find((g) => g.key === goal)!;

  const bmr = calculateBMR(gender, weightInKg, heightInCm, age);
  const tdee = Math.round(bmr * activityData.multiplier);
  const calories = Math.round(tdee * (1 + goalData.calorieAdjust));

  const proteinG = Math.round(weightInKg * goalData.proteinMult);
  const proteinCals = proteinG * 4;
  const fatCals = Math.round(calories * 0.25);
  const fatG = Math.round(fatCals / 9);
  const carbCals = calories - proteinCals - fatCals;
  const carbG = Math.round(carbCals / 4);

  function handleCalculate() {
    setCalculated(true);
    setApplied(false);
  }

  async function handleApply() {
    setApplying(true);
    try {
      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calorieTarget: calories,
          proteinTarget: proteinG,
          carbTarget: carbG,
          fatTarget: fatG,
        }),
      });
      if (res.ok) {
        setApplied(true);
      }
    } catch {
      // silent fail
    } finally {
      setApplying(false);
    }
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
              <h1 className="text-lg font-bold tracking-tight">Macro Calculator</h1>
              <p className="text-xs text-neutral-500">Mifflin-St Jeor equation</p>
            </div>
          </div>
          <span className="text-xs font-black tracking-[0.2em] text-[#0066FF]">FORC3</span>
        </div>
      </header>

      <div className="px-5 pt-5 space-y-4 max-w-lg mx-auto">
        {/* Personal Info */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-4">
          <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Personal Info</p>

          {/* Age */}
          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(Math.max(1, Math.min(120, parseInt(e.target.value) || 0)))}
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white font-semibold focus:outline-none focus:border-[#0066FF]/50"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block">Gender</label>
            <div className="grid grid-cols-2 gap-2">
              {(["M", "F"] as Gender[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                    gender === g
                      ? "bg-[#0066FF] text-white"
                      : "bg-[#0a0a0a] border border-[#262626] text-neutral-400"
                  }`}
                >
                  {g === "M" ? "Male" : "Female"}
                </button>
              ))}
            </div>
          </div>

          {/* Height */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-neutral-500">Height</label>
              <button
                onClick={() => {
                  if (heightUnit === "cm") {
                    const totalIn = Math.round(heightCm / 2.54);
                    setHeightFt(Math.floor(totalIn / 12));
                    setHeightIn(totalIn % 12);
                    setHeightUnit("ft");
                  } else {
                    setHeightCm(Math.round(heightFt * 30.48 + heightIn * 2.54));
                    setHeightUnit("cm");
                  }
                }}
                className="text-xs text-[#0066FF] font-semibold"
              >
                Switch to {heightUnit === "cm" ? "ft/in" : "cm"}
              </button>
            </div>
            {heightUnit === "cm" ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Math.max(50, Math.min(300, parseInt(e.target.value) || 0)))}
                  className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white font-semibold focus:outline-none focus:border-[#0066FF]/50"
                />
                <span className="text-neutral-500 text-sm font-medium w-8">cm</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={heightFt}
                  onChange={(e) => setHeightFt(Math.max(1, Math.min(8, parseInt(e.target.value) || 0)))}
                  className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white font-semibold focus:outline-none focus:border-[#0066FF]/50"
                />
                <span className="text-neutral-500 text-sm font-medium w-6">ft</span>
                <input
                  type="number"
                  value={heightIn}
                  onChange={(e) => setHeightIn(Math.max(0, Math.min(11, parseInt(e.target.value) || 0)))}
                  className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white font-semibold focus:outline-none focus:border-[#0066FF]/50"
                />
                <span className="text-neutral-500 text-sm font-medium w-6">in</span>
              </div>
            )}
          </div>

          {/* Weight */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-neutral-500">Weight</label>
              <button
                onClick={() => {
                  if (weightUnit === "kg") {
                    setWeightValue(Math.round(weightValue * 2.20462));
                    setWeightUnit("lbs");
                  } else {
                    setWeightValue(Math.round(weightValue * 0.453592));
                    setWeightUnit("kg");
                  }
                }}
                className="text-xs text-[#0066FF] font-semibold"
              >
                Switch to {weightUnit === "kg" ? "lbs" : "kg"}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={weightValue}
                onChange={(e) => setWeightValue(Math.max(20, Math.min(500, parseInt(e.target.value) || 0)))}
                className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white font-semibold focus:outline-none focus:border-[#0066FF]/50"
              />
              <span className="text-neutral-500 text-sm font-medium w-8">{weightUnit}</span>
            </div>
          </div>
        </div>

        {/* Activity Level */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-3">
          <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Activity Level</p>
          <div className="space-y-2">
            {ACTIVITY_LEVELS.map((level) => (
              <button
                key={level.key}
                onClick={() => setActivity(level.key)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between ${
                  activity === level.key
                    ? "bg-[#0066FF]/10 border border-[#0066FF]/40"
                    : "bg-[#0a0a0a] border border-[#262626]"
                }`}
              >
                <div>
                  <p className={`text-sm font-semibold ${activity === level.key ? "text-[#0066FF]" : "text-white"}`}>
                    {level.label}
                  </p>
                  <p className="text-xs text-neutral-500">{level.desc}</p>
                </div>
                {activity === level.key && (
                  <div className="w-5 h-5 bg-[#0066FF] rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Goal */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-3">
          <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Goal</p>
          <div className="grid grid-cols-3 gap-2">
            {GOALS.map((g) => (
              <button
                key={g.key}
                onClick={() => setGoal(g.key)}
                className={`py-4 rounded-xl text-center transition-all ${
                  goal === g.key
                    ? "bg-[#0066FF] text-white"
                    : "bg-[#0a0a0a] border border-[#262626] text-neutral-400"
                }`}
              >
                <span className="text-xl block mb-1">{g.icon}</span>
                <span className="text-xs font-semibold">{g.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          className="w-full py-4 bg-[#0066FF] text-white font-bold rounded-2xl text-sm active:scale-[0.98] transition-transform"
        >
          Calculate Macros
        </button>

        {/* Results */}
        <AnimatePresence>
          {calculated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Calorie Summary */}
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
                <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-4">Your Daily Targets</p>

                <div className="text-center mb-2">
                  <p className="text-xs text-neutral-500">BMR: {Math.round(bmr)} cal | TDEE: {tdee} cal</p>
                </div>

                <div className="text-center mb-6">
                  <p className="text-4xl font-black text-white">{calories}</p>
                  <p className="text-sm text-neutral-500 mt-1">calories / day</p>
                  {goalData.calorieAdjust !== 0 && (
                    <p className="text-xs text-[#FFB300] mt-1">
                      {goalData.calorieAdjust > 0 ? "+" : ""}{Math.round(goalData.calorieAdjust * 100)}% from TDEE for {goalData.label.toLowerCase()}
                    </p>
                  )}
                </div>

                {/* Macro Rings */}
                <div className="grid grid-cols-3 gap-4 place-items-center">
                  <div className="flex flex-col items-center">
                    <ProgressRing percent={(proteinCals / calories) * 100} color="#0066FF">
                      <span className="text-lg font-bold text-white">{proteinG}</span>
                      <span className="text-[9px] text-neutral-500">g</span>
                    </ProgressRing>
                    <p className="text-xs font-semibold text-[#0066FF] mt-2">Protein</p>
                    <p className="text-[10px] text-neutral-500">{Math.round((proteinCals / calories) * 100)}%</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <ProgressRing percent={(carbCals / calories) * 100} color="#FFB300">
                      <span className="text-lg font-bold text-white">{carbG}</span>
                      <span className="text-[9px] text-neutral-500">g</span>
                    </ProgressRing>
                    <p className="text-xs font-semibold text-[#FFB300] mt-2">Carbs</p>
                    <p className="text-[10px] text-neutral-500">{Math.round((carbCals / calories) * 100)}%</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <ProgressRing percent={(fatCals / calories) * 100} color="#00C853">
                      <span className="text-lg font-bold text-white">{fatG}</span>
                      <span className="text-[9px] text-neutral-500">g</span>
                    </ProgressRing>
                    <p className="text-xs font-semibold text-[#00C853] mt-2">Fat</p>
                    <p className="text-[10px] text-neutral-500">{Math.round((fatCals / calories) * 100)}%</p>
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
                <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-3">Breakdown</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Protein</span>
                    <div className="text-right">
                      <span className="font-bold text-white">{proteinG}g</span>
                      <span className="text-xs text-neutral-500 ml-2">({proteinCals} cal)</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-[#0a0a0a] rounded-full overflow-hidden">
                    <div className="h-full bg-[#0066FF] rounded-full transition-all duration-700" style={{ width: `${(proteinCals / calories) * 100}%` }} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Carbohydrates</span>
                    <div className="text-right">
                      <span className="font-bold text-white">{carbG}g</span>
                      <span className="text-xs text-neutral-500 ml-2">({carbCals} cal)</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-[#0a0a0a] rounded-full overflow-hidden">
                    <div className="h-full bg-[#FFB300] rounded-full transition-all duration-700" style={{ width: `${(carbCals / calories) * 100}%` }} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Fat</span>
                    <div className="text-right">
                      <span className="font-bold text-white">{fatG}g</span>
                      <span className="text-xs text-neutral-500 ml-2">({fatCals} cal)</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-[#0a0a0a] rounded-full overflow-hidden">
                    <div className="h-full bg-[#00C853] rounded-full transition-all duration-700" style={{ width: `${(fatCals / calories) * 100}%` }} />
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <button
                onClick={handleApply}
                disabled={applying || applied}
                className={`w-full py-4 font-bold rounded-2xl text-sm transition-all ${
                  applied
                    ? "bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/30"
                    : "bg-[#00C853] text-white active:scale-[0.98]"
                } disabled:opacity-60`}
              >
                {applying ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : applied ? (
                  "Targets Applied"
                ) : (
                  "Apply to My Targets"
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav active="home" />
    </main>
  );
}
