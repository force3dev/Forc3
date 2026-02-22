"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingData {
  // Screen 2: Goal
  goal: string;
  // Screen 3: Experience
  experienceLevel: string;
  // Screen 4: Schedule
  trainingDays: number;
  // Screen 5: Equipment
  equipment: string;
  // Screen 6: Injuries
  injuries: string[];
  // Screen 7: Sport
  sport: string;
  // Screen 8: Body Stats
  name: string;
  age: number;
  gender: string;
  weight: number;
  height: number;
  unitSystem: "imperial" | "metric";
  heightFt: number;
  heightIn: number;
  // Screen 9: Goal Description (free-text)
  goalDescription: string;
}

const SPLIT_PREVIEW: Record<number, Record<string, string>> = {
  2: { beginner: "Full Body", intermediate: "Full Body", advanced: "Full Body" },
  3: { beginner: "Full Body", intermediate: "Full Body / PPL", advanced: "Push/Pull/Legs" },
  4: { beginner: "Upper/Lower", intermediate: "Upper/Lower", advanced: "Upper/Lower or PPL" },
  5: { beginner: "Upper/Lower + 1", intermediate: "Push/Pull/Legs", advanced: "Push/Pull/Legs" },
  6: { beginner: "Push/Pull/Legs", intermediate: "Push/Pull/Legs", advanced: "PPL or Bro Split" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [planResult, setPlanResult] = useState<{
    plan: { name: string; split: string; daysPerWeek: number };
    macros: { calories: number; protein: number; carbs: number; fat: number };
  } | null>(null);

  const [data, setData] = useState<OnboardingData>({
    goal: "",
    experienceLevel: "",
    trainingDays: 4,
    equipment: "",
    injuries: [],
    sport: "",
    name: "",
    age: 25,
    gender: "male",
    weight: 175,
    height: 178,
    unitSystem: "imperial",
    heightFt: 5,
    heightIn: 10,
    goalDescription: "",
  });

  const totalSteps = 11;

  const update = (patch: Partial<OnboardingData>) =>
    setData(prev => ({ ...prev, ...patch }));

  const toggleInjury = (inj: string) => {
    if (inj === "none") {
      update({ injuries: [] });
      return;
    }
    setData(prev => ({
      ...prev,
      injuries: prev.injuries.includes(inj)
        ? prev.injuries.filter(i => i !== inj)
        : [...prev.injuries.filter(i => i !== "none"), inj],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1: return true;
      case 2: return !!data.goal;
      case 3: return !!data.experienceLevel;
      case 4: return data.trainingDays >= 2;
      case 5: return !!data.equipment;
      case 6: return true; // skippable
      case 7: return true; // skippable
      case 8: return data.age > 0 && data.weight > 0 && !!data.gender;
      case 9: return true; // skippable free-text
      case 10: return false; // calculating screen handles its own transition
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setCalculating(true);
    setError(null);

    const weightKg =
      data.unitSystem === "imperial" ? data.weight * 0.453592 : data.weight;
    const heightCm =
      data.unitSystem === "imperial"
        ? (data.heightFt * 12 + data.heightIn) * 2.54
        : data.height;

    try {
      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          age: data.age,
          gender: data.gender,
          weight: weightKg,
          height: heightCm,
          goal: data.goal,
          goalDescription: data.goalDescription,
          experienceLevel: data.experienceLevel,
          trainingDays: data.trainingDays,
          equipment: data.equipment,
          injuries: data.injuries,
          sport: data.sport || null,
          unitSystem: data.unitSystem,
        }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Failed");

      setPlanResult(result);
      setStep(11);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep(8); // go back to stats
    } finally {
      setCalculating(false);
    }
  };

  // Auto-advance through calculating screen
  useEffect(() => {
    if (step === 10) {
      const timer = setTimeout(() => {
        handleSubmit();
      }, 2800);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const next = () => {
    if (step < totalSteps) setStep(s => s + 1);
  };
  const prev = () => {
    if (step > 1) setStep(s => s - 1);
  };

  const progress = ((step - 1) / (totalSteps - 1)) * 100;

  // ─── Render Screens ─────────────────────────────────────────────────────────

  if (step === 11 && planResult) {
    const splits: Record<string, string> = {
      ppl: "Push / Pull / Legs",
      upper_lower: "Upper / Lower",
      full_body: "Full Body",
    };
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1">
            <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3</div>
            <h1 className="text-3xl font-bold">Your Plan is Ready</h1>
            <p className="text-neutral-400">Tailored to your exact goals.</p>
          </div>

          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[#262626]">
              <span className="text-neutral-400 text-sm">Program</span>
              <span className="font-semibold">{planResult.plan.name}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#262626]">
              <span className="text-neutral-400 text-sm">Split</span>
              <span className="font-semibold">{splits[planResult.plan.split] || planResult.plan.split}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#262626]">
              <span className="text-neutral-400 text-sm">Training Days</span>
              <span className="font-semibold">{planResult.plan.daysPerWeek}x per week</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#262626]">
              <span className="text-neutral-400 text-sm">Daily Calories</span>
              <span className="font-semibold text-[#0066FF]">{Math.round(planResult.macros.calories).toLocaleString()} kcal</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#262626]">
              <span className="text-neutral-400 text-sm">Protein Target</span>
              <span className="font-semibold text-[#00C853]">{Math.round(planResult.macros.protein)}g</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#262626]">
              <span className="text-neutral-400 text-sm">Carbs</span>
              <span className="font-semibold">{Math.round(planResult.macros.carbs)}g</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-neutral-400 text-sm">Fat</span>
              <span className="font-semibold">{Math.round(planResult.macros.fat)}g</span>
            </div>
          </div>

          <button
            onClick={() => router.push("/onboarding/welcome")}
            className="w-full py-4 bg-[#0066FF] text-white font-bold rounded-xl hover:bg-[#0052CC] transition-colors"
          >
            Meet Your Coach →
          </button>
        </div>
      </main>
    );
  }

  if (step === 10) {
    const messages = [
      "Analyzing your profile...",
      "Selecting optimal exercises...",
      "Calculating nutrition targets...",
      "Building your program...",
    ];
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div className="space-y-2">
            <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3</div>
            <h1 className="text-2xl font-bold">Building Your Program</h1>
          </div>

          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-[#0066FF]/20 rounded-full" />
            <div
              className="absolute inset-0 border-4 border-[#0066FF] rounded-full border-t-transparent animate-spin"
              style={{ animationDuration: "1s" }}
            />
          </div>

          <AnimatingMessages messages={messages} />

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-0.5 bg-[#1a1a1a]">
        <div
          className="h-full bg-[#0066FF] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full">
        {step > 1 && (
          <button
            onClick={prev}
            className="mt-4 mb-2 text-neutral-500 text-sm flex items-center gap-1 hover:text-white transition-colors"
          >
            ← Back
          </button>
        )}

        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div className="text-xs text-[#666666] tracking-widest">
            STEP {step} OF {totalSteps}
          </div>

          {/* ── Screen 1: Welcome ─────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3</div>
                <h1 className="text-3xl font-bold leading-tight">
                  Let&apos;s build your perfect program.
                </h1>
                <p className="text-neutral-400 text-base mt-3">
                  11 quick questions. PhD-level results.
                  We&apos;ll create a training program and nutrition targets
                  tailored exactly to you.
                </p>
              </div>
              <div className="space-y-3 text-sm text-neutral-500">
                <div className="flex items-center gap-3">
                  <span className="text-[#0066FF]">✓</span>
                  <span>Evidence-based programming</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#0066FF]">✓</span>
                  <span>Adapts to your schedule & equipment</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#0066FF]">✓</span>
                  <span>Auto-progresses as you get stronger</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Screen 2: Goal ────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">What&apos;s your primary goal?</h1>
              <div className="space-y-3">
                {[
                  { key: "fat_loss", icon: "🔥", label: "Lose Fat", desc: "Cut fat, preserve muscle" },
                  { key: "muscle_gain", icon: "💪", label: "Build Muscle", desc: "Maximize hypertrophy" },
                  { key: "strength", icon: "🏋️", label: "Get Stronger", desc: "Increase your lifts" },
                  { key: "endurance", icon: "❤️", label: "Improve Endurance", desc: "Cardio & conditioning" },
                  { key: "general", icon: "⚖️", label: "General Fitness", desc: "Overall health & fitness" },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => update({ goal: opt.key })}
                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4 ${
                      data.goal === opt.key
                        ? "bg-[#0066FF]/10 border-[#0066FF] text-white"
                        : "bg-[#0a0a0a] border-[#262626] hover:border-neutral-600"
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <div className="font-semibold">{opt.label}</div>
                      <div className={`text-sm ${data.goal === opt.key ? "text-[#0066FF]" : "text-neutral-500"}`}>
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Screen 3: Experience ──────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">How long have you been training?</h1>
              <div className="space-y-3">
                {[
                  { key: "beginner", label: "Beginner", desc: "0–1 year" },
                  { key: "intermediate", label: "Intermediate", desc: "1–3 years" },
                  { key: "advanced", label: "Advanced", desc: "3+ years" },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => update({ experienceLevel: opt.key })}
                    className={`w-full p-5 rounded-xl border text-left transition-all ${
                      data.experienceLevel === opt.key
                        ? "bg-[#0066FF]/10 border-[#0066FF]"
                        : "bg-[#0a0a0a] border-[#262626] hover:border-neutral-600"
                    }`}
                  >
                    <div className="font-semibold text-lg">{opt.label}</div>
                    <div className={`text-sm mt-1 ${data.experienceLevel === opt.key ? "text-[#0066FF]" : "text-neutral-500"}`}>
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Screen 4: Schedule ────────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">How many days per week can you train?</h1>
              <div className="grid grid-cols-5 gap-3">
                {[2, 3, 4, 5, 6].map(d => (
                  <button
                    key={d}
                    onClick={() => update({ trainingDays: d })}
                    className={`aspect-square rounded-xl border font-bold text-lg transition-all ${
                      data.trainingDays === d
                        ? "bg-[#0066FF] border-[#0066FF] text-white"
                        : "bg-[#0a0a0a] border-[#262626] hover:border-neutral-600"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              {data.trainingDays && data.experienceLevel && (
                <div className="bg-[#141414] border border-[#262626] rounded-xl p-4">
                  <div className="text-xs text-[#0066FF] font-semibold uppercase tracking-wide mb-1">
                    Your Split
                  </div>
                  <div className="font-semibold text-lg">
                    {SPLIT_PREVIEW[data.trainingDays]?.[data.experienceLevel] || "Push/Pull/Legs"}
                  </div>
                  <div className="text-sm text-neutral-500 mt-1">
                    Optimal for {data.trainingDays} training days
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Screen 5: Equipment ───────────────────────────────────────── */}
          {step === 5 && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">What equipment do you have?</h1>
              <div className="space-y-3">
                {[
                  { key: "full_gym", label: "Full Gym", desc: "Barbells, cables, machines, everything" },
                  { key: "home_gym", label: "Home Gym", desc: "Dumbbells, bench, pull-up bar" },
                  { key: "minimal", label: "Minimal", desc: "Dumbbells only" },
                  { key: "bodyweight", label: "Bodyweight Only", desc: "No equipment needed" },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => update({ equipment: opt.key })}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      data.equipment === opt.key
                        ? "bg-[#0066FF]/10 border-[#0066FF]"
                        : "bg-[#0a0a0a] border-[#262626] hover:border-neutral-600"
                    }`}
                  >
                    <div className="font-semibold">{opt.label}</div>
                    <div className={`text-sm mt-0.5 ${data.equipment === opt.key ? "text-[#0066FF]" : "text-neutral-500"}`}>
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Screen 6: Injuries ────────────────────────────────────────── */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Any injuries or limitations?</h1>
                <p className="text-neutral-500 text-sm mt-1">We&apos;ll work around them. Skippable.</p>
              </div>
              <div className="space-y-3">
                {[
                  { key: "lower_back", label: "Lower Back" },
                  { key: "shoulders", label: "Shoulders" },
                  { key: "knees", label: "Knees" },
                  { key: "wrists", label: "Wrists" },
                  { key: "neck", label: "Neck" },
                  { key: "elbows", label: "Elbows" },
                  { key: "none", label: "No limitations ✓" },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => toggleInjury(opt.key)}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      (opt.key === "none" && data.injuries.length === 0) ||
                      data.injuries.includes(opt.key)
                        ? "bg-[#0066FF]/10 border-[#0066FF]"
                        : "bg-[#0a0a0a] border-[#262626] hover:border-neutral-600"
                    }`}
                  >
                    <div className="font-medium">{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Screen 7: Sport Focus ─────────────────────────────────────── */}
          {step === 7 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Training for a specific sport?</h1>
                <p className="text-neutral-500 text-sm mt-1">Optional — we&apos;ll optimize for it.</p>
              </div>
              <div className="space-y-3">
                {[
                  { key: "", label: "None / General Fitness" },
                  { key: "basketball", label: "Basketball" },
                  { key: "running", label: "Running / Marathon" },
                  { key: "soccer", label: "Soccer" },
                  { key: "swimming", label: "Swimming" },
                  { key: "mma", label: "MMA / Fighting" },
                  { key: "powerlifting", label: "Powerlifting" },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => update({ sport: opt.key })}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      data.sport === opt.key
                        ? "bg-[#0066FF]/10 border-[#0066FF]"
                        : "bg-[#0a0a0a] border-[#262626] hover:border-neutral-600"
                    }`}
                  >
                    <div className="font-medium">{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Screen 8: Body Stats ──────────────────────────────────────── */}
          {step === 8 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Your body stats</h1>
                <p className="text-neutral-500 text-sm mt-1">
                  Used to calculate your nutrition targets.
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="text-sm text-neutral-400">First Name (optional)</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={e => update({ name: e.target.value })}
                  placeholder="Your name"
                  className="mt-2 w-full p-4 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none transition-colors"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="text-sm text-neutral-400">Sex (for accurate BMR)</label>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {["male", "female", "other"].map(g => (
                    <button
                      key={g}
                      onClick={() => update({ gender: g })}
                      className={`py-3 rounded-xl border capitalize font-medium transition-all ${
                        data.gender === g
                          ? "bg-[#0066FF] border-[#0066FF] text-white"
                          : "bg-[#0a0a0a] border-[#262626] hover:border-neutral-600"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age */}
              <div>
                <label className="text-sm text-neutral-400">Age</label>
                <input
                  type="number"
                  value={data.age}
                  onChange={e => update({ age: parseInt(e.target.value) || 0 })}
                  className="mt-2 w-full p-4 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none transition-colors"
                  min={14}
                  max={99}
                />
              </div>

              {/* Units */}
              <div>
                <label className="text-sm text-neutral-400">Units</label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {(["imperial", "metric"] as const).map(u => (
                    <button
                      key={u}
                      onClick={() => update({ unitSystem: u })}
                      className={`py-3 rounded-xl border font-medium transition-all ${
                        data.unitSystem === u
                          ? "bg-[#0066FF] border-[#0066FF] text-white"
                          : "bg-[#0a0a0a] border-[#262626] hover:border-neutral-600"
                      }`}
                    >
                      {u === "imperial" ? "lbs / ft" : "kg / cm"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight */}
              <div>
                <label className="text-sm text-neutral-400">
                  Weight ({data.unitSystem === "imperial" ? "lbs" : "kg"})
                </label>
                <input
                  type="number"
                  value={data.weight}
                  onChange={e => update({ weight: parseFloat(e.target.value) || 0 })}
                  className="mt-2 w-full p-4 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none transition-colors"
                  step={0.5}
                />
              </div>

              {/* Height */}
              {data.unitSystem === "imperial" ? (
                <div>
                  <label className="text-sm text-neutral-400">Height</label>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="number"
                        value={data.heightFt}
                        onChange={e => update({ heightFt: parseInt(e.target.value) || 0 })}
                        className="w-full p-4 pr-10 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none transition-colors"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">ft</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={data.heightIn}
                        onChange={e => update({ heightIn: parseInt(e.target.value) || 0 })}
                        className="w-full p-4 pr-10 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none transition-colors"
                        min={0}
                        max={11}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">in</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-sm text-neutral-400">Height (cm)</label>
                  <input
                    type="number"
                    value={data.height}
                    onChange={e => update({ height: parseInt(e.target.value) || 0 })}
                    className="mt-2 w-full p-4 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none transition-colors"
                  />
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ── Screen 9: Goal Description (free-text) ────────────────────── */}
          {step === 9 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Tell us more about your goal</h1>
                <p className="text-neutral-500 text-sm mt-1">
                  In your own words — your AI coach will read this. Skippable.
                </p>
              </div>
              <div>
                <textarea
                  value={data.goalDescription}
                  onChange={e => update({ goalDescription: e.target.value })}
                  placeholder="e.g. I want to lose 20 lbs before my wedding in June. I've struggled with staying consistent before and tend to skip leg day..."
                  rows={6}
                  className="w-full p-4 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none transition-colors text-sm resize-none leading-relaxed"
                />
                <p className="text-xs text-neutral-600 mt-2">
                  {data.goalDescription.length > 0
                    ? `${data.goalDescription.length} characters`
                    : "Optional — skip to continue"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Nav buttons */}
        {step !== 10 && step !== 11 && (
          <div className="pt-6 pb-4">
            <button
              onClick={step === 9 ? () => setStep(10) : next}
              disabled={!canProceed() || loading}
              className={`w-full py-4 font-bold rounded-xl transition-all ${
                canProceed() && !loading
                  ? "bg-[#0066FF] text-white hover:bg-[#0052CC]"
                  : "bg-[#0a0a0a] text-neutral-600 cursor-not-allowed border border-[#262626]"
              }`}
            >
              {step === 9 ? "Build My Plan" : step === 1 ? "Let's Go →" : "Continue"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

// Cycling message component for the calculating screen
function AnimatingMessages({ messages }: { messages: string[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx(i => (i + 1) % messages.length);
    }, 700);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <p className="text-neutral-400 text-sm min-h-[1.5rem] transition-all">
      {messages[idx]}
    </p>
  );
}
