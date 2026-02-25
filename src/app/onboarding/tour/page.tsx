"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const SLIDES = [
  {
    icon: "📊",
    title: "Your Dashboard",
    description:
      "See today's workout, streak, weekly progress, and AI coaching tips — all in one glance.",
    color: "#0066FF",
  },
  {
    icon: "🏋️",
    title: "Training Plans",
    description:
      "AI-generated programs tailored to your goals, experience, and schedule. Adapts as you progress.",
    color: "#00C853",
  },
  {
    icon: "📖",
    title: "Exercise Library",
    description:
      "500+ exercises with GIF demos, coaching cues, muscle maps, and smart alternatives.",
    color: "#FF6D00",
  },
  {
    icon: "🏃",
    title: "Cardio Training",
    description:
      "Structured running, swimming, cycling, rowing, and HIIT templates — not just 'go run.'",
    color: "#00BCD4",
  },
  {
    icon: "🧠",
    title: "AI Coach Alex",
    description:
      "Ask anything. Coach Alex knows your history, your PRs, your injuries, and your goals.",
    color: "#7C4DFF",
  },
  {
    icon: "🥗",
    title: "Nutrition Tracking",
    description:
      "Log meals with AI estimation, barcode scan, or food search. Track macros and hydration.",
    color: "#FFB300",
  },
  {
    icon: "📈",
    title: "Progress & PRs",
    description:
      "Track personal records, body measurements, progress photos, and workout streaks over time.",
    color: "#E91E63",
  },
  {
    icon: "👥",
    title: "Community",
    description:
      "Follow friends, share workouts, compete on leaderboards, and complete weekly challenges.",
    color: "#0066FF",
  },
];

export default function FeatureTourPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
    },
    [current]
  );

  function next() {
    if (current < SLIDES.length - 1) {
      goTo(current + 1);
    } else {
      finish();
    }
  }

  function finish() {
    localStorage.setItem("forc3_tour_seen", "true");
    router.push("/dashboard");
  }

  function skip() {
    localStorage.setItem("forc3_tour_seen", "true");
    router.push("/dashboard");
  }

  const slide = SLIDES[current];

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Skip button */}
      <div className="flex justify-end px-5 pt-8">
        <button
          onClick={skip}
          className="text-sm text-neutral-500 hover:text-white transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            initial={{ opacity: 0, x: direction * 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -80 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col items-center"
          >
            {/* Icon */}
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mb-8"
              style={{ backgroundColor: `${slide.color}15`, border: `2px solid ${slide.color}30` }}
            >
              {slide.icon}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-black mb-3">{slide.title}</h2>

            {/* Description */}
            <p className="text-neutral-400 leading-relaxed max-w-xs">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-8">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-6 h-2 bg-[#0066FF]"
                : "w-2 h-2 bg-[#333]"
            }`}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="px-6 pb-10 flex gap-3">
        {current > 0 && (
          <button
            onClick={() => goTo(current - 1)}
            className="flex-1 py-4 bg-[#1a1a1a] border border-[#262626] text-white font-bold rounded-2xl"
          >
            Back
          </button>
        )}
        <button
          onClick={next}
          className="flex-1 py-4 bg-[#0066FF] text-white font-black rounded-2xl hover:bg-[#0052CC] transition-colors"
        >
          {current === SLIDES.length - 1 ? "Get Started" : "Next"}
        </button>
      </div>
    </main>
  );
}
