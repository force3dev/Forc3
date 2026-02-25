"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { haptics } from "@/lib/haptics";

const CARDIO_TYPES = [
  { value: "run", emoji: "🏃", label: "Run" },
  { value: "bike", emoji: "🚴", label: "Bike" },
  { value: "swim", emoji: "🏊", label: "Swim" },
  { value: "row", emoji: "🚣", label: "Row" },
  { value: "hike", emoji: "🥾", label: "Hike" },
  { value: "walk", emoji: "🚶", label: "Walk" },
  { value: "other", emoji: "⚡", label: "Other" },
];

const INTENSITIES = [
  { value: "low", label: "Easy", desc: "Zone 1-2, conversational", color: "text-green-400" },
  { value: "moderate", label: "Moderate", desc: "Zone 3, comfortably hard", color: "text-yellow-400" },
  { value: "high", label: "Hard", desc: "Zone 4-5, threshold/intervals", color: "text-red-400" },
  { value: "race", label: "Race", desc: "Race pace or time trial", color: "text-purple-400" },
];

export default function CardioPage() {
  const router = useRouter();
  const [type, setType] = useState("run");
  const [intensity, setIntensity] = useState("moderate");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [avgHR, setAvgHR] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!duration) return;
    setSaving(true);
    haptics.success();

    try {
      await fetch("/api/cardio/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          intensity,
          duration: parseInt(duration),
          distance: distance ? parseFloat(distance) : null,
          avgHeartRate: avgHR ? parseInt(avgHR) : null,
          notes: notes || null,
          title: `${CARDIO_TYPES.find(t => t.value === type)?.label} · ${duration}min`,
        }),
      });

      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-dvh bg-black text-white pb-32">
      <div className="px-5 pt-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-neutral-400 p-2 -ml-2">←</button>
          <h1 className="text-2xl font-black">Log Cardio</h1>
        </div>

        {/* Activity Type */}
        <div className="mb-6">
          <p className="text-neutral-500 text-xs uppercase tracking-wider mb-3">Activity Type</p>
          <div className="grid grid-cols-4 gap-2">
            {CARDIO_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => { setType(t.value); haptics.light(); }}
                className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 transition-all active:scale-95 ${
                  type === t.value ? "border-[#00C853] bg-[#00C853]/10" : "border-[#262626] bg-[#141414]"
                }`}
              >
                <span className="text-2xl">{t.emoji}</span>
                <span className="text-xs font-medium text-neutral-300">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Duration + Distance */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
            <p className="text-neutral-500 text-xs uppercase tracking-wider mb-2">Duration</p>
            <div className="flex items-end gap-2">
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="30"
                inputMode="numeric"
                className="flex-1 bg-transparent text-3xl font-black text-white focus:outline-none w-full"
              />
              <span className="text-neutral-500 mb-1">min</span>
            </div>
          </div>
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
            <p className="text-neutral-500 text-xs uppercase tracking-wider mb-2">Distance</p>
            <div className="flex items-end gap-2">
              <input
                type="number"
                value={distance}
                onChange={e => setDistance(e.target.value)}
                placeholder="5.0"
                inputMode="decimal"
                step="0.1"
                className="flex-1 bg-transparent text-3xl font-black text-white focus:outline-none w-full"
              />
              <span className="text-neutral-500 mb-1">km</span>
            </div>
          </div>
        </div>

        {/* Heart Rate */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 mb-6">
          <p className="text-neutral-500 text-xs uppercase tracking-wider mb-2">Avg Heart Rate (optional)</p>
          <div className="flex items-end gap-2">
            <input
              type="number"
              value={avgHR}
              onChange={e => setAvgHR(e.target.value)}
              placeholder="145"
              inputMode="numeric"
              className="flex-1 bg-transparent text-3xl font-black text-white focus:outline-none"
            />
            <span className="text-neutral-500 mb-1">bpm</span>
          </div>
          {avgHR && (
            <p className="text-xs mt-2 text-neutral-400">
              Zone: {parseInt(avgHR) < 115 ? "1 — Very light" : parseInt(avgHR) < 135 ? "2 — Light (fat burn)" : parseInt(avgHR) < 155 ? "3 — Moderate (aerobic)" : parseInt(avgHR) < 175 ? "4 — Hard (threshold)" : "5 — Max effort"}
            </p>
          )}
        </div>

        {/* Intensity */}
        <div className="mb-6">
          <p className="text-neutral-500 text-xs uppercase tracking-wider mb-3">How hard?</p>
          <div className="space-y-2">
            {INTENSITIES.map(i => (
              <button
                key={i.value}
                onClick={() => { setIntensity(i.value); haptics.light(); }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-95 text-left ${
                  intensity === i.value ? "border-[#00C853] bg-[#00C853]/10" : "border-[#262626] bg-[#141414]"
                }`}
              >
                <div className="flex-1">
                  <span className={`font-bold ${i.color}`}>{i.label}</span>
                  <p className="text-neutral-500 text-xs">{i.desc}</p>
                </div>
                {intensity === i.value && <span className="text-green-400">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-8">
          <p className="text-neutral-500 text-xs uppercase tracking-wider mb-2">Notes (optional)</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="How did it feel? Course, conditions, etc."
            className="w-full bg-[#141414] border border-[#262626] rounded-2xl px-4 py-4 text-white placeholder-neutral-600 focus:outline-none text-base resize-none"
            rows={3}
          />
        </div>

        {/* Save */}
        <button
          onClick={save}
          disabled={!duration || saving}
          className="w-full bg-[#00C853] disabled:opacity-40 text-black font-black text-xl py-5 rounded-3xl active:scale-95 transition-all"
        >
          {saving ? "Saving..." : "Log Session ✓"}
        </button>
      </div>
    </div>
  );
}
