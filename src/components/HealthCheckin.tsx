"use client";
import { useEffect, useState } from "react";

type Soreness = "None" | "Mild" | "Moderate" | "Severe";

function sliderEmoji(val: number): { emoji: string; label: string } {
  if (val <= 3) return { emoji: "😴", label: "Poor" };
  if (val <= 6) return { emoji: "😐", label: "Ok" };
  if (val <= 8) return { emoji: "😊", label: "Good" };
  return { emoji: "🌟", label: "Great" };
}

const SORENESS_OPTIONS: Soreness[] = ["None", "Mild", "Moderate", "Severe"];

export default function HealthCheckin() {
  const [dismissed, setDismissed] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);
  const [sleep, setSleep] = useState(7);
  const [energy, setEnergy] = useState(7);
  const [soreness, setSoreness] = useState<Soreness>("None");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("health_checkin_date");
    const today = new Date().toDateString();
    if (stored === today) setDismissed(true);
  }, []);

  if (dismissed) return null;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sleepQuality: sleep,
          energyLevel: energy,
          soreness,
        }),
      });
    } catch {
      // best-effort
    }
    localStorage.setItem("health_checkin_date", new Date().toDateString());
    setAnimateOut(true);
    setTimeout(() => setDismissed(true), 500);
    setSubmitting(false);
  }

  const sleepFeedback = sliderEmoji(sleep);
  const energyFeedback = sliderEmoji(energy);

  return (
    <div
      className="overflow-hidden transition-all duration-500"
      style={animateOut ? { opacity: 0, maxHeight: 0 } : { opacity: 1, maxHeight: 600 }}
    >
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#0066FF]/20 flex items-center justify-center text-lg">
            🩺
          </div>
          <div>
            <div className="text-xs font-bold tracking-widest text-[#0066FF]">MORNING CHECK-IN</div>
            <div className="text-xs text-neutral-500">How are you feeling today?</div>
          </div>
        </div>

        {/* Sleep Quality */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-200">How did you sleep?</span>
            <span className="text-sm font-semibold text-white flex items-center gap-1.5">
              <span>{sleepFeedback.emoji}</span>
              <span className="text-neutral-400">{sleepFeedback.label}</span>
              <span className="text-[#0066FF]">{sleep}</span>
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={sleep}
            onChange={(e) => setSleep(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#0066FF] bg-[#262626]"
          />
          <div className="flex justify-between text-[10px] text-neutral-600">
            <span>1</span><span>10</span>
          </div>
        </div>

        {/* Energy Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-200">Energy level right now?</span>
            <span className="text-sm font-semibold text-white flex items-center gap-1.5">
              <span>{energyFeedback.emoji}</span>
              <span className="text-neutral-400">{energyFeedback.label}</span>
              <span className="text-[#0066FF]">{energy}</span>
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#0066FF] bg-[#262626]"
          />
          <div className="flex justify-between text-[10px] text-neutral-600">
            <span>1</span><span>10</span>
          </div>
        </div>

        {/* Soreness */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-neutral-200">Any soreness or pain?</span>
          <div className="grid grid-cols-4 gap-2">
            {SORENESS_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setSoreness(opt)}
                className={`py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  soreness === opt
                    ? "bg-[#0066FF] border-[#0066FF] text-white"
                    : "bg-[#1a1a1a] border-[#262626] text-neutral-400 hover:border-[#0066FF]/50"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3.5 bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-50 text-white font-bold rounded-xl transition-colors text-sm"
        >
          {submitting ? "Saving…" : "Update My Coach"}
        </button>
      </div>
    </div>
  );
}
