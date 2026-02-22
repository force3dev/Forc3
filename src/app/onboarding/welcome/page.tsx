"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface WelcomeData {
  greeting: string;
  planSummary: string;
  firstWeekFocus: string;
  motivationalNote: string;
}

export default function OnboardingWelcomePage() {
  const router = useRouter();
  const [welcome, setWelcome] = useState<WelcomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/coach/welcome", { method: "POST" })
      .then(r => r.json())
      .then(data => {
        setWelcome(data);
        setLoading(false);
      })
      .catch(() => {
        setWelcome({
          greeting: "Welcome to FORC3. Your personalized training program is ready.",
          planSummary: "Your plan has been built based on your goals, experience, and schedule. Follow it consistently and you'll see results.",
          firstWeekFocus: "Focus on learning the movements and building the habit. Don't miss the first week.",
          motivationalNote: "The hardest part is starting. You already did that.",
        });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center space-y-6">
          <div className="text-5xl animate-pulse">🧠</div>
          <div>
            <div className="text-xs font-bold tracking-widest text-[#0066FF] mb-2">FORC3 AI</div>
            <p className="text-neutral-400 text-sm">Personalizing your experience...</p>
          </div>
          <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col p-6 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex-1 flex flex-col justify-center space-y-6 py-8"
      >
        {/* Coach Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0066FF]/20 border border-[#0066FF]/40 flex items-center justify-center text-2xl">
            🤖
          </div>
          <div>
            <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3 AI COACH</div>
            <div className="text-sm text-neutral-400 mt-0.5">Your personalized guide</div>
          </div>
        </div>

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <p className="text-xl font-semibold leading-relaxed">
            {welcome?.greeting}
          </p>
        </motion.div>

        {/* Plan Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-1"
        >
          <div className="text-xs font-bold tracking-widest text-[#0066FF] mb-2">YOUR PROGRAM</div>
          <p className="text-sm text-neutral-300 leading-relaxed">
            {welcome?.planSummary}
          </p>
        </motion.div>

        {/* First Week Focus Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-1"
        >
          <div className="text-xs font-bold tracking-widest text-[#00C853] mb-2">WEEK 1 FOCUS</div>
          <p className="text-sm text-neutral-300 leading-relaxed">
            {welcome?.firstWeekFocus}
          </p>
        </motion.div>

        {/* Motivational Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.5 }}
          className="px-1"
        >
          <p className="text-neutral-500 text-sm italic">
            &ldquo;{welcome?.motivationalNote}&rdquo;
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="pt-2"
        >
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-4 bg-[#0066FF] text-white font-bold rounded-xl hover:bg-[#0052CC] transition-colors"
          >
            Let&apos;s Get Started 💪
          </button>
        </motion.div>
      </motion.div>
    </main>
  );
}
