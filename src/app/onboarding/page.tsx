"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const GOALS = [
  { key: "build_muscle", icon: "💪", label: "Build Muscle" },
  { key: "strength", icon: "🏋️", label: "Get Stronger" },
  { key: "lose_fat", icon: "🔥", label: "Lose Fat" },
  { key: "endurance", icon: "🏃", label: "Run / Endurance" },
  { key: "hybrid", icon: "🔄", label: "Hybrid: Strength + Endurance" },
  { key: "general_fitness", icon: "⚡", label: "General Fitness" },
  { key: "race_training", icon: "🏅", label: "Train for a Race" },
  { key: "custom", icon: "🎯", label: "Custom Goal" },
];

const EQUIPMENT = [
  { key: "full_gym", icon: "🏋️", label: "Full Gym" },
  { key: "dumbbells", icon: "💪", label: "Dumbbells" },
  { key: "bands", icon: "🔗", label: "Bands" },
  { key: "bodyweight", icon: "🏠", label: "Bodyweight" },
  { key: "kettlebells", icon: "🔔", label: "Kettlebells" },
  { key: "cardio_machines", icon: "🚴", label: "Cardio Machines" },
];

const EXPERIENCES = ["beginner", "intermediate", "advanced"];
const DAYS = [2, 3, 4, 5, 6];
const SESSION_LENGTHS = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
  { value: 90, label: "90 min+" },
];

const LOADING_STEPS = [
  { text: "Analyzing your goals", delay: 0 },
  { text: "Designing your schedule", delay: 1800 },
  { text: "Selecting your exercises", delay: 3500 },
  { text: "Personalizing with AI", delay: 5500 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [raceType, setRaceType] = useState("");
  const [experience, setExperience] = useState("");
  const [trainingDays, setTrainingDays] = useState(4);
  const [sessionLength, setSessionLength] = useState(60);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [hasInjury, setHasInjury] = useState(false);
  const [injuryNote, setInjuryNote] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric");
  const [loadingStep, setLoadingStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const submittedRef = useRef(false);

  const totalSteps = 6;

  function toggleEquipment(key: string) {
    setEquipment(prev =>
      prev.includes(key) ? prev.filter(e => e !== key) : [...prev, key]
    );
  }

  // When we reach step 6, animate loading steps and submit
  useEffect(() => {
    if (step !== 6) return;

    let cancelled = false;
    // Animate the loading steps
    LOADING_STEPS.forEach((s, i) => {
      setTimeout(() => {
        if (!cancelled) setLoadingStep(i);
      }, s.delay);
    });

    // Submit after last step animation
    const submitTimer = setTimeout(async () => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);

      try {
        const effectiveEquipment = equipment.length > 0 ? equipment : ["full_gym"];
        const res = await fetch("/api/user/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name || "Athlete",
            goal,
            customGoal: goal === "custom" ? customGoal : null,
            goalDescription: null,
            experienceLevel: experience,
            trainingDays,
            sessionLength,
            equipment: effectiveEquipment,
            limitations: hasInjury && injuryNote ? [injuryNote] : [],
            sport: null,
            age: age ? parseInt(age) : 25,
            gender: gender || "male",
            weight: weight
              ? unitSystem === "imperial" ? Math.round(parseFloat(weight) * 0.453592) : parseFloat(weight)
              : 70,
            height: height
              ? unitSystem === "imperial" ? Math.round(parseFloat(height) * 2.54) : parseFloat(height)
              : 175,
            unitSystem,
            nutritionGoal: "maintain",
            raceGoals: raceType ? [{ type: raceType, priority: "A" }] : [],
            trainingVolume: "intermediate",
          }),
        });
        if (res.ok) {
          setSubmitted(true);
          setTimeout(() => router.push("/dashboard"), 1200);
        } else {
          router.push("/dashboard");
        }
      } catch {
        router.push("/dashboard");
      } finally {
        setSubmitting(false);
      }
    }, 7500);

    return () => {
      cancelled = true;
      clearTimeout(submitTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const canAdvance = () => {
    if (step === 1) return true;
    if (step === 2) return !!goal && (goal !== "custom" || customGoal.trim().length > 0);
    if (step === 3) return !!experience && sessionLength > 0;
    if (step === 4) return true; // body stats are optional
    if (step === 5) return equipment.length > 0;
    return false;
  };

  function goNext() {
    if (canAdvance() && step < totalSteps) setStep(s => s + 1);
  }
  function goBack() {
    if (step > 1) setStep(s => s - 1);
  }

  const progressDots = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="flex-1 flex flex-col min-h-screen"
        >
          {/* Progress dots */}
          {step < 6 && (
            <div className="flex items-center justify-center gap-2 pt-12 pb-4">
              {progressDots.map(dot => (
                <div
                  key={dot}
                  className={`rounded-full transition-all duration-300 ${
                    dot === step
                      ? "w-6 h-2 bg-[#0066FF]"
                      : dot < step
                      ? "w-2 h-2 bg-[#0066FF]/60"
                      : "w-2 h-2 bg-[#262626]"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Back button */}
          {step > 1 && step < 6 && (
            <button
              onClick={goBack}
              className="absolute top-10 left-5 text-neutral-500 hover:text-white transition-colors p-2"
            >
              ←
            </button>
          )}

          {/* ── SCREEN 1: WELCOME ──────────────────────────────────────────── */}
          {step === 1 && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-8">
              <div className="space-y-2">
                <div className="relative inline-block">
                  <div className="text-6xl font-black tracking-tight">
                    <span className="text-[#0066FF]">FORC</span>3
                  </div>
                  <div className="absolute inset-0 blur-2xl bg-[#0066FF]/20 -z-10" />
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-black leading-tight">
                  Your AI Coach<br />is Ready
                </h1>
                <p className="text-neutral-400 leading-relaxed max-w-xs mx-auto">
                  Answer 4 quick questions and Coach Alex will build your personalized program.
                </p>
              </div>

              <div className="space-y-3 w-full max-w-xs">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="What's your name? (optional)"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-[#141414] border border-[#262626] rounded-2xl px-5 py-4 text-center text-white placeholder-neutral-600 focus:outline-none focus:border-[#0066FF] transition-colors"
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={goNext}
                  className="w-full py-4 bg-[#0066FF] text-white font-black text-lg rounded-2xl hover:bg-[#0052CC] transition-colors"
                >
                  Let's Go →
                </motion.button>
              </div>
            </div>
          )}

          {/* ── SCREEN 2: GOAL ─────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="flex-1 flex flex-col px-5 pt-4 pb-32">
              <div className="mb-6">
                <h1 className="text-2xl font-black mb-1">What's your #1 goal?</h1>
                <p className="text-neutral-500 text-sm">Coach Alex will build your program around this.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {GOALS.map(g => (
                  <motion.button
                    key={g.key}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setGoal(g.key)}
                    className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 transition-all ${
                      goal === g.key
                        ? "border-[#0066FF] bg-[#0066FF]/10"
                        : "border-[#262626] bg-[#141414] hover:border-[#333]"
                    }`}
                  >
                    <span className="text-3xl">{g.icon}</span>
                    <span className="text-sm font-semibold text-center leading-tight">{g.label}</span>
                  </motion.button>
                ))}
              </div>

              {goal === "custom" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <textarea
                    placeholder="Describe your goal..."
                    value={customGoal}
                    onChange={e => setCustomGoal(e.target.value)}
                    rows={3}
                    className="w-full bg-[#141414] border border-[#0066FF]/50 rounded-2xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#0066FF] resize-none transition-colors"
                  />
                </motion.div>
              )}

              {goal === "race_training" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <p className="text-sm font-semibold text-neutral-300 mb-3">What race?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "5K", label: "5K", emoji: "🏃" },
                      { value: "10K", label: "10K", emoji: "🏃" },
                      { value: "Half Marathon", label: "Half Marathon", emoji: "🏅" },
                      { value: "Marathon", label: "Marathon", emoji: "🏆" },
                      { value: "Sprint Triathlon", label: "Sprint Tri", emoji: "🏊" },
                      { value: "Olympic Triathlon", label: "Olympic Tri", emoji: "🏊" },
                      { value: "Half Ironman", label: "70.3 Ironman", emoji: "💪" },
                      { value: "Ironman", label: "Ironman", emoji: "🔥" },
                      { value: "Obstacle Race", label: "OCR", emoji: "🥷" },
                      { value: "Cycling Event", label: "Cycling", emoji: "🚴" },
                    ].map(r => (
                      <button
                        key={r.value}
                        onClick={() => setRaceType(r.value)}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all active:scale-95 ${
                          raceType === r.value
                            ? "border-[#0066FF] bg-[#0066FF]/10"
                            : "border-[#262626] bg-[#141414]"
                        }`}
                      >
                        <span>{r.emoji}</span>
                        <span className="text-sm font-medium">{r.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* ── SCREEN 3: ABOUT YOU ───────────────────────────────────────── */}
          {step === 3 && (
            <div className="flex-1 flex flex-col px-5 pt-4 pb-32 space-y-6">
              <div>
                <h1 className="text-2xl font-black mb-1">Tell Coach Alex about yourself</h1>
                <p className="text-neutral-500 text-sm">This shapes how your program is built.</p>
              </div>

              {/* Experience */}
              <div>
                <p className="text-sm font-semibold text-neutral-300 mb-3">Training Experience</p>
                <div className="flex gap-2">
                  {EXPERIENCES.map(exp => (
                    <button
                      key={exp}
                      onClick={() => setExperience(exp)}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold capitalize transition-all ${
                        experience === exp
                          ? "bg-[#0066FF] text-white"
                          : "bg-[#141414] border border-[#262626] text-neutral-400 hover:border-[#333]"
                      }`}
                    >
                      {exp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Training Days */}
              <div>
                <p className="text-sm font-semibold text-neutral-300 mb-3">Days per week</p>
                <div className="flex gap-2">
                  {DAYS.map(d => (
                    <button
                      key={d}
                      onClick={() => setTrainingDays(d)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                        trainingDays === d
                          ? "bg-[#0066FF] text-white"
                          : "bg-[#141414] border border-[#262626] text-neutral-400 hover:border-[#333]"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Session Length */}
              <div>
                <p className="text-sm font-semibold text-neutral-300 mb-3">Session length</p>
                <div className="flex gap-2 flex-wrap">
                  {SESSION_LENGTHS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setSessionLength(s.value)}
                      className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
                        sessionLength === s.value
                          ? "bg-[#0066FF] text-white"
                          : "bg-[#141414] border border-[#262626] text-neutral-400 hover:border-[#333]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SCREEN 4: BODY STATS ────────────────────────────────────── */}
          {step === 4 && (
            <div className="flex-1 flex flex-col px-5 pt-4 pb-32 space-y-6">
              <div>
                <h1 className="text-2xl font-black mb-1">Your body stats</h1>
                <p className="text-neutral-500 text-sm">Optional but helps Coach Alex dial in your plan.</p>
              </div>

              {/* Gender */}
              <div>
                <p className="text-sm font-semibold text-neutral-300 mb-3">Gender</p>
                <div className="flex gap-2">
                  {(["male", "female"] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold capitalize transition-all ${
                        gender === g
                          ? "bg-[#0066FF] text-white"
                          : "bg-[#141414] border border-[#262626] text-neutral-400 hover:border-[#333]"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Units */}
              <div>
                <p className="text-sm font-semibold text-neutral-300 mb-3">Units</p>
                <div className="flex gap-2">
                  {(["metric", "imperial"] as const).map(u => (
                    <button
                      key={u}
                      onClick={() => setUnitSystem(u)}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                        unitSystem === u
                          ? "bg-[#0066FF] text-white"
                          : "bg-[#141414] border border-[#262626] text-neutral-400 hover:border-[#333]"
                      }`}
                    >
                      {u === "metric" ? "Metric (kg/cm)" : "Imperial (lb/in)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age, Weight, Height */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-neutral-500 font-semibold mb-1.5 block">Age</label>
                  <input
                    type="number"
                    placeholder="25"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className="w-full bg-[#141414] border border-[#262626] rounded-xl px-3 py-3 text-white text-center font-semibold focus:border-[#0066FF] outline-none placeholder-neutral-600"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 font-semibold mb-1.5 block">
                    Weight ({unitSystem === "metric" ? "kg" : "lb"})
                  </label>
                  <input
                    type="number"
                    placeholder={unitSystem === "metric" ? "70" : "155"}
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    className="w-full bg-[#141414] border border-[#262626] rounded-xl px-3 py-3 text-white text-center font-semibold focus:border-[#0066FF] outline-none placeholder-neutral-600"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 font-semibold mb-1.5 block">
                    Height ({unitSystem === "metric" ? "cm" : "in"})
                  </label>
                  <input
                    type="number"
                    placeholder={unitSystem === "metric" ? "175" : "69"}
                    value={height}
                    onChange={e => setHeight(e.target.value)}
                    className="w-full bg-[#141414] border border-[#262626] rounded-xl px-3 py-3 text-white text-center font-semibold focus:border-[#0066FF] outline-none placeholder-neutral-600"
                  />
                </div>
              </div>

              <p className="text-xs text-neutral-600 text-center">
                Skip if you prefer — you can always update this in Settings.
              </p>
            </div>
          )}

          {/* ── SCREEN 5: SETUP ───────────────────────────────────────────── */}
          {step === 5 && (
            <div className="flex-1 flex flex-col px-5 pt-4 pb-32 space-y-6">
              <div>
                <h1 className="text-2xl font-black mb-1">What do you have available?</h1>
                <p className="text-neutral-500 text-sm">Select all that apply.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {EQUIPMENT.map(eq => (
                  <motion.button
                    key={eq.key}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleEquipment(eq.key)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                      equipment.includes(eq.key)
                        ? "border-[#0066FF] bg-[#0066FF]/10"
                        : "border-[#262626] bg-[#141414] hover:border-[#333]"
                    }`}
                  >
                    <span className="text-2xl">{eq.icon}</span>
                    <span className="text-sm font-semibold leading-tight">{eq.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Injuries */}
              <div>
                <p className="text-sm font-semibold text-neutral-300 mb-3">Any injuries or limitations?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setHasInjury(false)}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                      !hasInjury ? "bg-[#0066FF] text-white" : "bg-[#141414] border border-[#262626] text-neutral-400"
                    }`}
                  >
                    No limitations
                  </button>
                  <button
                    onClick={() => setHasInjury(true)}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                      hasInjury ? "bg-orange-500 text-white" : "bg-[#141414] border border-[#262626] text-neutral-400"
                    }`}
                  >
                    Yes — tell us
                  </button>
                </div>
                {hasInjury && (
                  <motion.input
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    type="text"
                    placeholder="e.g. bad lower back, knee issues..."
                    value={injuryNote}
                    onChange={e => setInjuryNote(e.target.value)}
                    className="mt-3 w-full bg-[#141414] border border-orange-500/40 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                )}
              </div>
            </div>
          )}

          {/* ── SCREEN 6: BUILDING ─────────────────────────────────────────── */}
          {step === 6 && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-10">
              {/* Animated logo */}
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="relative"
              >
                <div className="text-6xl font-black tracking-tight">
                  <span className="text-[#0066FF]">FORC</span>3
                </div>
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 blur-3xl bg-[#0066FF]/30 -z-10 scale-150"
                />
              </motion.div>

              <div className="space-y-2">
                <h1 className="text-2xl font-black">Building your program...</h1>
                <p className="text-neutral-500 text-sm">This takes about 10 seconds</p>
              </div>

              <div className="space-y-3 w-full max-w-xs text-left">
                {LOADING_STEPS.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: loadingStep >= i ? 1 : 0.3, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    {submitted || loadingStep > i ? (
                      <span className="text-[#00C853] text-lg">✅</span>
                    ) : loadingStep === i ? (
                      <div className="w-5 h-5 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    ) : (
                      <span className="text-neutral-600 text-lg">○</span>
                    )}
                    <span className={`text-sm ${loadingStep >= i ? "text-white" : "text-neutral-600"}`}>
                      {s.text}
                    </span>
                  </motion.div>
                ))}
              </div>

              {submitted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="font-bold text-[#00C853]">Your program is ready!</p>
                  <p className="text-neutral-500 text-sm mt-1">Taking you to your dashboard...</p>
                </motion.div>
              )}

              {submitting && !submitted && loadingStep >= 3 && (
                <p className="text-xs text-neutral-600">Finalizing...</p>
              )}
            </div>
          )}

          {/* ── BOTTOM BUTTON (screens 2-4) ──────────────────────────────── */}
          {step >= 2 && step < 6 && (
            <div className="fixed bottom-0 left-0 right-0 px-5 pb-10 pt-4 bg-gradient-to-t from-black via-black/90 to-transparent">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={goNext}
                disabled={!canAdvance()}
                className="w-full py-4 bg-[#0066FF] text-white font-black rounded-2xl disabled:opacity-30 transition-opacity"
              >
                Continue →
              </motion.button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
