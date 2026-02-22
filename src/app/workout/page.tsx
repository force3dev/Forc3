"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/shared/BottomNav";
import { CardioActivityPicker, CardioType } from "@/components/cardio/CardioActivityPicker";

export default function WorkoutPage() {
  const router = useRouter();
  const [activeType, setActiveType] = useState<"strength" | "cardio">("strength");

  const handleCardioSelect = (type: CardioType, sport?: string) => {
    const path = sport
      ? `/workout/cardio/${type.id}?sport=${encodeURIComponent(sport)}`
      : `/workout/cardio/${type.id}`;
    router.push(path);
  };

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold mb-4">Training</h1>

        {/* Type toggle */}
        <div className="flex bg-[#141414] border border-[#262626] rounded-xl p-1">
          <button
            onClick={() => setActiveType("strength")}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              activeType === "strength"
                ? "bg-[#0066FF] text-white"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            🏋️ Strength
          </button>
          <button
            onClick={() => setActiveType("cardio")}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              activeType === "cardio"
                ? "bg-[#0066FF] text-white"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            🏃 Cardio
          </button>
        </div>
      </header>

      {activeType === "strength" ? (
        <div className="px-5 space-y-4">
          {/* Quick Links */}
          <Link
            href="/dashboard"
            className="flex items-center justify-between bg-[#141414] border border-[#262626] rounded-2xl p-5 hover:border-[#0066FF]/50 transition-colors"
          >
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Today</p>
              <h2 className="font-bold text-lg">Today&apos;s Workout</h2>
              <p className="text-sm text-neutral-500 mt-0.5">View your scheduled training</p>
            </div>
            <span className="text-[#0066FF] text-xl">→</span>
          </Link>

          <Link
            href="/workout/create"
            className="flex items-center justify-between bg-[#141414] border border-[#262626] rounded-2xl p-5 hover:border-[#0066FF]/50 transition-colors"
          >
            <div>
              <h2 className="font-bold">Create Workout</h2>
              <p className="text-sm text-neutral-500 mt-0.5">Build a custom workout from scratch</p>
            </div>
            <span className="text-2xl">+</span>
          </Link>

          <Link
            href="/history"
            className="flex items-center justify-between bg-[#141414] border border-[#262626] rounded-2xl p-5 hover:border-[#0066FF]/50 transition-colors"
          >
            <div>
              <h2 className="font-bold">History</h2>
              <p className="text-sm text-neutral-500 mt-0.5">View past workouts</p>
            </div>
            <span className="text-neutral-500">→</span>
          </Link>

          <Link
            href="/plan"
            className="flex items-center justify-between bg-[#141414] border border-[#262626] rounded-2xl p-5 hover:border-[#0066FF]/50 transition-colors"
          >
            <div>
              <h2 className="font-bold">Training Plan</h2>
              <p className="text-sm text-neutral-500 mt-0.5">View your weekly schedule</p>
            </div>
            <span className="text-neutral-500">→</span>
          </Link>
        </div>
      ) : (
        <CardioActivityPicker onSelect={handleCardioSelect} />
      )}

      <BottomNav active="workout" />
    </main>
  );
}
