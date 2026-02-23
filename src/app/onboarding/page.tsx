"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RaceGoal {
  type: string;
  date?: string;
  priority: "a" | "b";
}

interface OnboardingData {
  // Screen 2: Goal
  goal: string;
  customGoal: string; // for "custom" goal
  // Screen 3: Experience
  experienceLevel: string;
  // Screen 4: Training Days
  trainingDays: number;
  // Screen 5: Session Length [NEW]
  sessionLength: number; // 30, 45, 60, 90
  // Screen 6: Equipment (multi-select)
  equipment: string[];
  // Screen 7: Physical Limitations (multi-select)
  limitations: string[];
  // Screen 8: Sport Focus
  sport: string;
  customSport: string; // for "other" sport
  // Screen 9: Race / Event Goals
  raceGoals: RaceGoal[];
  raceDate: string;
  trainingVolume: string;
  // Screen 10: Body Stats
  name: string;
  age: number;
  gender: string;
  weight: number;
  height: number;
  unitSystem: "imperial" | "metric";
  heightFt: number;
  heightIn: number;
  nutritionGoal: string; // cut, maintain, bulk, performance
  // Screen 11: Goal Description
  goalDescription: string;
}

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
    customGoal: "",
    experienceLevel: "",
    trainingDays: 4,
    sessionLength: 0,
    equipment: [],
    limitations: [],
    sport: "",
    customSport: "",
    raceGoals: [],
    raceDate: "",
    trainingVolume: "",
    name: "",
    age: 25,
    gender: "male",
    weight: 175,
    height: 178,
    unitSystem: "imperial",
    heightFt: 5,
    heightIn: 10,
    nutritionGoal: "maintain",
    goalDescription: "",
  });

  const totalSteps = 13;

  const update = (patch: Partial<OnboardingData>) =>
    setData(prev => ({ ...prev, ...patch }));

  const toggleEquipment = (key: string) => {
    setData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(key)
        ? prev.equipment.filter(e => e !== key)
        : [...prev.equipment, key],
    }));
  };

  const toggleLimitation = (key: string) => {
    if (key === "none") {
      update({ limitations: [] });
      return;
    }
    setData(prev => ({
      ...prev,
      limitations: prev.limitations.includes(key)
        ? prev.limitations.filter(i => i !== key)
        : [...prev.limitations.filter(i => i !== "none"), key],
    }));
  };

  const toggleRaceGoal = (type: string) => {
    setData(prev => {
      const exists = prev.raceGoals.some(r => r.type === type);
      if (exists) {
        return { ...prev, raceGoals: prev.raceGoals.filter(r => r.type !== type) };
      } else {
        return { ...prev, raceGoals: [...prev.raceGoals, { type, priority: "a" }] };
      }
    });
  };

  const canProceed = () => {
    switch (step) {
      case 1: return true;
      case 2: return !!data.goal;
      case 3: return !!data.experienceLevel;
      case 4: return data.trainingDays >= 2;
      case 5: return data.sessionLength > 0;
      case 6: return data.equipment.length > 0;
      case 7: return true; // limitations skippable
      case 8: // sport — required if sport_performance or compete goal
        if (data.goal === "sport_performance" || data.goal === "compete") {
          return !!data.sport;
        }
        return true;
      case 9: return true; // race goals skippable
      case 10: return data.age > 0 && data.weight > 0 && !!data.gender;
      case 11: return true; // goal description skippable
      case 12: return false; // calculating screen handles its own transition
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
      const raceGoalsWithDate = data.raceGoals.map(r => ({
        ...r,
        date: data.raceDate || undefined,
      }));

      const effectiveSport = data.sport === "other" ? data.customSport : data.sport;
      const effectiveGoalDesc = data.goal === "custom"
        ? data.customGoal
        : data.goalDescription;

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
          customGoal: data.customGoal || null,
          goalDescription: effectiveGoalDesc || null,
          experienceLevel: data.experienceLevel,
          trainingDays: data.trainingDays,
          sessionLength: data.sessionLength,
          equipment: data.equipment,
          limitations: data.limitations,
          sport: effectiveSport || null,
          unitSystem: data.unitSystem,
          nutritionGoal: data.nutritionGoal,
          raceGoals: raceGoalsWithDate,
          trainingVolume: data.trainingVolume || null,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed");

      setPlanResult(result);
      setStep(13);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep(10); // go back to stats
    } finally {
      setCalculating(false);
    }
  };

  // Auto-advance through calculating screen
  useEffect(() => {
    if (step === 12) {
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

  if (step === 13 && planResult) {
    const splits: Record<string, string> = {
      ppl: "Push / Pull / Legs",
      upper_lower: "Upper / Lower",
      full_body: "Full Body",
      custom: "Custom Split",
      ai_generated: "AI-Generated",
    };
    return (
      <MeetYourCoachScreen
        planResult={planResult}
        goal={data.goal}
        splits={splits}
        onStart={() => router.push("/onboarding/welcome")}
      />
    );
  }

  if (step === 12) {
    return <OnboardingLoadingScreen error={error} />;
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
                  12 quick questions. PhD-level results.
                  We&apos;ll create a training program and nutrition targets
                  tailored exactly to you — whatever your goal.
                </p>
              </div>
              <div className="space-y-3 text-sm text-neutral-500">
                <div className="flex items-center gap-3">
                  <span className="text-[#0066FF]">✓</span>
                  <span>Personalized for YOUR specific goal</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#0066FF]">✓</span>
                  <span>Adapts to your schedule & equipment</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#0066FF]">✓</span>
                  <span>Auto-progresses as you improve</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Screen 2: Primary Goal ────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">What&apos;s your primary goal?</h1>
              <div className="space-y-2">
                {[
                  { key: "muscle_gain", icon: "💪", label: "Build muscle / Bodybuilding", desc: "Maximize size and definition" },
                  { key: "strength", icon: "🏋️", label: "Get stronger / Powerlifting", desc: "Increase your 1RMs" },
                  { key: "fat_loss", icon: "🔥", label: "Lose fat / Body recomposition", desc: "Cut fat, preserve muscle" },
                  { key: "endurance", icon: "🏃", label: "Run faster / Endurance", desc: "Aerobic base & speed work" },
                  { key: "triathlon", icon: "🏊🚴🏃", label: "Triathlon / Multi-sport", desc: "Swim, bike, run + strength" },
                  { key: "general", icon: "⚡", label: "General fitness / Feel better", desc: "Overall health & energy" },
                  { key: "sport_performance", icon: "🥊", label: "Sport performance", desc: "MMA, football, basketball, etc." },
                  { key: "longevity", icon: "🧘", label: "Improve health / Longevity", desc: "Long-term wellbeing" },
                  { key: "compete", icon: "🏆", label: "Compete in a specific event", desc: "Peak for a race or competition" },
                  { key: "hybrid", icon: "🔄", label: "Hybrid athlete", desc: "Strength + cardio combined" },
                  { key: "custom", icon: "🎯", label: "Custom goal", desc: "Describe it in your own words" },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => update({ goal: opt.key })}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      data.goal === opt.key
                        ? "bg-[#0066FF]/10 border-[#0066FF] text-white"
                        : "bg-[#0a0a0a] border-[#262626] hover:border-neutral-600"
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm">{opt.label}</div>
                      <div className={`text-xs mt-0.5 ${data.goal === opt.key ? "text-[#0066FF]" : "text-neutral-500"}`}>
                        {opt.desc}
                      </div>
                    </div>
                    {data.goal === opt.key && <span className="ml-auto text-[#0066FF] text-sm shrink-0">✓</span>}
                  </button>
                ))}
              </div>
              {/* Custom goal text input */}
              {data.goal === "custom" && (
                <div>
                  <textarea
                    value={data.customGoal}
                    onChange={e => update({ customGoal: e.target.value })}
                    placeholder="Describe your goal in your own words..."
                    rows={3}
                    className="w-full p-4 bg-[#0a0a0a] border border-[#0066FF] rounded-xl focus:outline-none text-sm resize-none"
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Screen 3: Experience Level ────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">What&apos;s your training experience?</h1>
              <div className="space-y-3">
                {[
                  { key: "complete_beginner", label: "Complete beginner", desc: "Never trained consistently" },
                  { key: "beginner", label: "Beginner", desc: "Trained occasionally, less than 1 year" },
                  { key: "intermediate", label: "Intermediate", desc: "1–3 years consistent training" },
                  { key: "advanced", label: "Advanced", desc: "3+ years, know what I'm doing" },
                  { key: "athlete", label: "Athlete", desc: "Competitive, high performance" },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => update({ experienceLevel: opt.key })}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      data.experienceLevel === opt.key
                        ? "bg-[#0066FF]/10 border-[#0066FF]"
                        : "bg-[#0a0a0a] border-[#262626] hover:border-neutral-600"
                    }`}
                  >
                    <div className="font-semibold">{opt.label}</div>
                    <div className={`text-sm mt-0.5 ${data.experienceLevel === opt.key ? "text-[#0066FF]" : "text-neutral-500"}`}>
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Screen 4: Training Days ───────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">How many days per week can you train?</h1>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { days: 2, desc: "Minimal" },
                  { days: 3, desc: "Moderate" },
                  { days: 4, desc: "Serious" },
                  { days: 5, desc: "Dedicated" },
                  { days: 6, desc: "Very serious" },
                  { days: 7, desc: "Elite" },
                ].map(({ days, desc }) => (
                  <button
                    key={days}
                    onClick={() => update({ trainingDays: days })}
                    className={`p-4 rounded-xl border font-bold text-lg transition-all flex flex-col items-center gap-1 ${
                      data.trainingDays === days
                        ? "bg-[#0066FF] border-[#0066FF] text-white"
                        : "bg-[#0a0a0a] border-[#262626] hover:border-neutral-600"
                    }`}
                  >
                    <span className="text-2xl">{days}</span>
                    <span className={`text-xs font-normal ${data.trainingDays === days ? "text-white/80" : "text-neutral-500"}`}>{desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Screen 5: Session Length [NEW] ───────────────────────────── */}
          {step === 5 && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">How long are your sessions?</h1>
              <p className="text-neutral-500 text-sm -mt-4">We&apos;ll fill every minute effectively.</p>
              <div className="space-y-3">
                {[
                  { mins: 30, label: "30 minutes", desc: "Short and effective" },
                  { mins: 45, label: "45 minutes", desc: "Standard session" },
                  { mins: 60, label: "60 minutes", desc: "Dedicated training" },
                  { mins: 90, label: "90+ minutes", desc: "Serious training" },
                ].map(opt => (
                  <button
                    key={opt.mins}
                    onClick={() => update({ sessionLength: opt.mins })}
                    className={`w-full p-4 rounded-xl border text-left transition-all flex justify-between items-center ${
                      data.sessionLength === opt.mins
                        ? "bg-[#0066FF]/10 border-[#0066FF]"
                        : "bg-[#0a0a0a] border-[#262626] hover:border-neutral-600"
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{opt.label}</div>
                      <div className={`text-sm mt-0.5 ${data.sessionLength === opt.mins ? "text-[#0066FF]" : "text-neutral-500"}`}>{opt.desc}</div>
                    </div>
                    {data.sessionLength === opt.mins && <span className="text-[#0066FF] text-lg">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Screen 6: Equipment (multi-select) ───────────────────────── */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">What equipment do you have?</h1>
                <p className="text-neutral-500 text-sm mt-1">Select all that apply.</p>
              </div>
              <div className="space-y-2">
                {[
                  { key: "full_gym", icon: "🏋️", label: "Full commercial gym", desc: "Barbells, cables, machines — everything" },
                  { key: "barbell_home", icon: "🥊", label: "Barbell + plates at home", desc: "Home power rack setup" },
                  { key: "dumbbells", icon: "💪", label: "Dumbbells", desc: "Adjustable or fixed dumbbells" },
                  { key: "bands", icon: "🔗", label: "Resistance bands", desc: "Loop or tube bands" },
                  { key: "pullup_bar", icon: "⬆️", label: "Pull-up bar", desc: "Doorframe or wall-mounted" },
                  { key: "bodyweight", icon: "🏠", label: "Bodyweight only", desc: "No equipment needed" },
                  { key: "kettlebells", icon: "🔔", label: "Kettlebells", desc: "One or more kettlebells" },
                  { key: "home_gym", icon: "📦", label: "Basic home gym", desc: "Bench, dumbbells, basic setup" },
                  { key: "cardio_machines", icon: "🚴", label: "Cardio machines", desc: "Bike, treadmill, rower, etc." },
                ].map(opt => {
                  const selected = data.equipment.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      onClick={() => toggleEquipment(opt.key)}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                        selected
                          ? "bg-[#0066FF]/10 border-[#0066FF] text-white"
                          : "bg-[#0a0a0a] border-[#262626] hover:border-neutral-600"
                      }`}
                    >
                      <span className="text-lg">{opt.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm">{opt.label}</div>
                        <div className={`text-xs mt-0.5 ${selected ? "text-[#0066FF]" : "text-neutral-500"}`}>{opt.desc}</div>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        selected ? "bg-[#0066FF] border-[#0066FF]" : "border-[#444]"
                      }`}>
                        {selected && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Screen 7: Physical Limitations ───────────────────────────── */}
          {step === 7 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Any physical limitations?</h1>
                <p className="text-neutral-500 text-sm mt-1">We&apos;ll work around them. Skippable.</p>
              </div>
              <div className="space-y-2">
                {[
                  { key: "lower_back", label: "Lower back issues" },
                  { key: "knee", label: "Knee problems" },
                  { key: "shoulder", label: "Shoulder injury" },
                  { key: "wrist_elbow", label: "Wrist / elbow issues" },
                  { key: "hip_mobility", label: "Hip mobility limitations" },
                  { key: "post_surgery", label: "Post-surgery recovery" },
                  { key: "neck", label: "Neck issues" },
                  { key: "none", label: "No limitations ✓" },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => toggleLimitation(opt.key)}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      (opt.key === "none" && data.limitations.length === 0) ||
                      data.limitations.includes(opt.key)
                        ? "bg-[#0066FF]/10 border-[#0066FF]"
                        : "bg-[#0a0a0a] border-[#262626] hover:border-neutral-600"
                    }`}
                  >
                    <div className="font-medium text-sm">{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Screen 8: Sport Focus ─────────────────────────────────────── */}
          {step === 8 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">
                  {data.goal === "sport_performance"
                    ? "Which sport are you training for?"
                    : data.goal === "compete"
                    ? "What event are you competing in?"
                    : "Training for a specific sport?"}
                </h1>
                <p className="text-neutral-500 text-sm mt-1">
                  {data.goal === "sport_performance" || data.goal === "compete"
                    ? "We'll build your program around it."
                    : "Optional — we'll optimize for it."}
                </p>
              </div>
              <div className="space-y-2">
                {[
                  { key: "", label: "None / General Fitness" },
                  { key: "running", label: "🏃 Running / Marathon" },
                  { key: "basketball", label: "🏀 Basketball" },
                  { key: "soccer", label: "⚽ Soccer / Football" },
                  { key: "swimming", label: "🏊 Swimming" },
                  { key: "mma", label: "🥊 MMA / Combat sports" },
                  { key: "powerlifting", label: "🏋️ Powerlifting" },
                  { key: "cycling", label: "🚴 Cycling" },
                  { key: "crossfit", label: "⚡ CrossFit" },
                  { key: "triathlon", label: "🏊🚴🏃 Triathlon" },
                  { key: "other", label: "✏️ Other (type below)" },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => update({ sport: opt.key })}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                      data.sport === opt.key
                        ? "bg-[#0066FF]/10 border-[#0066FF]"
                        : "bg-[#0a0a0a] border-[#262626] hover:border-neutral-600"
                    }`}
                  >
                    <div className="font-medium text-sm">{opt.label}</div>
                  </button>
                ))}
                {data.sport === "other" && (
                  <input
                    type="text"
                    value={data.customSport}
                    onChange={e => update({ customSport: e.target.value })}
                    placeholder="e.g. Tennis, Volleyball, Rugby..."
                    className="w-full p-4 bg-[#0a0a0a] border border-[#0066FF] rounded-xl focus:outline-none text-sm"
                    autoFocus
                  />
                )}
              </div>
            </div>
          )}

          {/* ── Screen 9: Race / Event Goals ──────────────────────────────── */}
          {step === 9 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Any upcoming races or events?</h1>
                <p className="text-neutral-500 text-sm mt-1">Select all that apply. Skippable.</p>
              </div>
              <div className="space-y-2">
                {[
                  { key: "5k_10k", label: "5K / 10K", icon: "🏃" },
                  { key: "half_marathon", label: "Half Marathon", icon: "🏃" },
                  { key: "full_marathon", label: "Full Marathon", icon: "🏃" },
                  { key: "swim_race", label: "Swim Meet / Open Water Race", icon: "🏊" },
                  { key: "cycling_race", label: "Cycling Race / Gran Fondo", icon: "🚴" },
                  { key: "sprint_tri", label: "Sprint Triathlon", icon: "🏊🚴🏃" },
                  { key: "olympic_tri", label: "Olympic Triathlon", icon: "🏊🚴🏃" },
                  { key: "half_ironman", label: "Half Ironman (70.3)", icon: "🏊🚴🏃" },
                  { key: "full_ironman", label: "Full Ironman", icon: "🏊🚴🏃" },
                  { key: "ocr", label: "Spartan / OCR Race", icon: "🧱" },
                  { key: "powerlifting_meet", label: "Powerlifting / Weightlifting Meet", icon: "💪" },
                  { key: "bodybuilding_show", label: "Bodybuilding / Physique Show", icon: "🏆" },
                ].map(opt => {
                  const selected = data.raceGoals.some(r => r.type === opt.key);
                  return (
                    <button
                      key={opt.key}
                      onClick={() => toggleRaceGoal(opt.key)}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                        selected
                          ? "bg-[#0066FF]/10 border-[#0066FF] text-white"
                          : "bg-[#0a0a0a] border-[#262626] hover:border-neutral-600"
                      }`}
                    >
                      <span className="text-base">{opt.icon}</span>
                      <span className="font-medium text-sm flex-1">{opt.label}</span>
                      {selected && <span className="ml-auto text-[#0066FF] text-sm">✓</span>}
                    </button>
                  );
                })}
                <button
                  onClick={() => update({ raceGoals: [], raceDate: "", trainingVolume: "" })}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                    data.raceGoals.length === 0
                      ? "bg-[#0066FF]/10 border-[#0066FF] text-white"
                      : "bg-[#0a0a0a] border-[#262626] hover:border-neutral-600"
                  }`}
                >
                  <span className="text-base">🎯</span>
                  <span className="font-medium text-sm flex-1">None right now</span>
                  {data.raceGoals.length === 0 && <span className="ml-auto text-[#0066FF] text-sm">✓</span>}
                </button>
              </div>

              {data.raceGoals.length > 0 && (
                <div className="space-y-4 pt-2 border-t border-[#262626]">
                  <div>
                    <label className="text-sm text-neutral-400">When is your earliest race?</label>
                    <input
                      type="date"
                      value={data.raceDate}
                      onChange={e => update({ raceDate: e.target.value })}
                      className="mt-2 w-full p-4 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none transition-colors text-white [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-neutral-400">Current weekly training volume</label>
                    <div className="mt-2 space-y-2">
                      {[
                        { key: "beginner", label: "Beginner", desc: "0–3 hrs/week" },
                        { key: "intermediate", label: "Intermediate", desc: "4–8 hrs/week" },
                        { key: "advanced", label: "Advanced", desc: "8+ hrs/week" },
                      ].map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => update({ trainingVolume: opt.key })}
                          className={`w-full p-3.5 rounded-xl border text-left transition-all flex justify-between items-center ${
                            data.trainingVolume === opt.key
                              ? "bg-[#0066FF]/10 border-[#0066FF]"
                              : "bg-[#0a0a0a] border-[#262626] hover:border-neutral-600"
                          }`}
                        >
                          <span className="font-medium text-sm">{opt.label}</span>
                          <span className={`text-xs ${data.trainingVolume === opt.key ? "text-[#0066FF]" : "text-neutral-500"}`}>{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Screen 10: Body Stats ─────────────────────────────────────── */}
          {step === 10 && (
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

              {/* Nutrition Goal */}
              <div>
                <label className="text-sm text-neutral-400">Nutrition Goal</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {[
                    { key: "cut", label: "Cut", desc: "Lose fat" },
                    { key: "maintain", label: "Maintain", desc: "Stay same" },
                    { key: "bulk", label: "Bulk", desc: "Gain mass" },
                    { key: "performance", label: "Performance", desc: "Fuel training" },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => update({ nutritionGoal: opt.key })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        data.nutritionGoal === opt.key
                          ? "bg-[#0066FF]/10 border-[#0066FF]"
                          : "bg-[#0a0a0a] border-[#262626] hover:border-neutral-600"
                      }`}
                    >
                      <div className="font-semibold text-sm">{opt.label}</div>
                      <div className={`text-xs mt-0.5 ${data.nutritionGoal === opt.key ? "text-[#0066FF]" : "text-neutral-500"}`}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ── Screen 11: Goal Description ───────────────────────────────── */}
          {step === 11 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Anything else your coach should know?</h1>
                <p className="text-neutral-500 text-sm mt-1">
                  Your AI coach will read this. Skippable.
                </p>
              </div>
              <div>
                <textarea
                  value={data.goalDescription}
                  onChange={e => update({ goalDescription: e.target.value })}
                  placeholder="e.g. I want to lose 20 lbs before my wedding. I've struggled with staying consistent and tend to skip leg day. I work a desk job..."
                  rows={6}
                  className="w-full p-4 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none transition-colors text-sm resize-none leading-relaxed"
                />
                <p className="text-xs text-neutral-600 mt-2">
                  {data.goalDescription.length > 0
                    ? `${data.goalDescription.length} characters`
                    : "Optional — skip to build your plan"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Nav buttons */}
        {step !== 12 && step !== 13 && (
          <div className="pt-6 pb-4">
            <button
              onClick={step === 11 ? () => setStep(12) : next}
              disabled={!canProceed() || loading}
              className={`w-full py-4 font-bold rounded-xl transition-all ${
                canProceed() && !loading
                  ? "bg-[#0066FF] text-white hover:bg-[#0052CC]"
                  : "bg-[#0a0a0a] text-neutral-600 cursor-not-allowed border border-[#262626]"
              }`}
            >
              {step === 11 ? "Build My Plan →" : step === 1 ? "Let's Go →" : "Continue"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────

const LOADING_STEPS = [
  "Analyzing your goals",
  "Building your personalized program",
  "Designing your training schedule",
  "Preparing your AI coach",
  "Your program is ready",
];

function OnboardingLoadingScreen({ error }: { error: string | null }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setVisibleCount(step);
      setProgress(Math.min(100, (step / LOADING_STEPS.length) * 100));
      if (step >= LOADING_STEPS.length) clearInterval(interval);
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-10 text-center">
        <div className="space-y-2">
          <div className="text-2xl font-black tracking-widest text-[#0066FF]">⚡ FORC3</div>
          <h1 className="text-xl font-bold text-white">Building your personalized program...</h1>
        </div>

        <div className="space-y-3 text-left">
          {LOADING_STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex items-center gap-3 transition-opacity duration-500 ${
                i < visibleCount ? "opacity-100" : "opacity-20"
              }`}
            >
              <span className="text-lg">
                {i < visibleCount ? "✅" : "⬜"}
              </span>
              <span className={`text-sm ${i < visibleCount ? "text-white" : "text-neutral-600"}`}>{s}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0066FF] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-neutral-500">{Math.round(progress)}%</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    </main>
  );
}

// ─── Meet Your Coach Screen ───────────────────────────────────────────────────

const GOAL_LABELS: Record<string, string> = {
  muscle_gain: "Bodybuilding",
  strength: "Powerlifting",
  fat_loss: "Fat Loss",
  endurance: "Endurance",
  triathlon: "Triathlon",
  general: "General Fitness",
  sport_performance: "Sport Performance",
  longevity: "Health & Longevity",
  compete: "Competition",
  hybrid: "Hybrid Athlete",
  custom: "Custom Goal",
};

function MeetYourCoachScreen({
  planResult,
  goal,
  splits,
  onStart,
}: {
  planResult: { plan: { name: string; split: string; daysPerWeek: number }; macros: { calories: number; protein: number; carbs: number; fat: number } };
  goal: string;
  splits: Record<string, string>;
  onStart: () => void;
}) {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Coach avatar */}
        <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-[#0066FF] to-[#00C853] flex items-center justify-center text-5xl shadow-lg shadow-blue-900/40">
          ⚡
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Meet Coach Alex</h1>
          <p className="text-neutral-400 leading-relaxed">
            Your personal AI coach. I&apos;ve analyzed your goals and built your first training week from scratch.
          </p>
          <p className="text-neutral-500 text-sm leading-relaxed">
            I&apos;ll adapt your program every week based on your performance and recovery. Ask me anything, anytime.
          </p>
        </div>

        {/* Plan summary */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Goal</span>
            <span className="font-semibold">{GOAL_LABELS[goal] || goal}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Program</span>
            <span className="font-semibold">{planResult.plan.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Split</span>
            <span className="font-semibold">{splits[planResult.plan.split] || planResult.plan.split}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Training</span>
            <span className="font-semibold">{planResult.plan.daysPerWeek}× per week</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Calories</span>
            <span className="font-semibold text-[#0066FF]">{Math.round(planResult.macros.calories).toLocaleString()} kcal</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Protein</span>
            <span className="font-semibold text-[#00C853]">{Math.round(planResult.macros.protein)}g</span>
          </div>
        </div>

        <button
          onClick={onStart}
          className="w-full py-4 bg-[#0066FF] text-white font-bold rounded-2xl text-lg hover:bg-[#0052CC] transition-colors"
        >
          Let&apos;s Start Training →
        </button>
      </div>
    </main>
  );
}
