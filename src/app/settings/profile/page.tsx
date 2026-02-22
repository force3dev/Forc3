"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProfileForm {
  name: string;
  age: string;
  weight: string;
  height: string;
  goal: string;
  experienceLevel: string;
  trainingDays: string;
  equipment: string;
  sport: string;
  injuries: string;
  unitSystem: string;
}

const GOALS = [
  { value: "fat_loss", label: "Fat Loss" },
  { value: "muscle_gain", label: "Build Muscle" },
  { value: "strength", label: "Get Stronger" },
  { value: "endurance", label: "Improve Endurance" },
  { value: "general", label: "General Fitness" },
];

const EXPERIENCE = [
  { value: "beginner", label: "Beginner (0–1 yr)" },
  { value: "intermediate", label: "Intermediate (1–3 yr)" },
  { value: "advanced", label: "Advanced (3+ yr)" },
];

const EQUIPMENT = [
  { value: "full_gym", label: "Full Gym" },
  { value: "home_gym", label: "Home Gym" },
  { value: "minimal", label: "Minimal (Dumbbells)" },
  { value: "bodyweight", label: "Bodyweight Only" },
];

export default function EditProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>({
    name: "", age: "", weight: "", height: "", goal: "general",
    experienceLevel: "beginner", trainingDays: "4",
    equipment: "full_gym", sport: "", injuries: "", unitSystem: "imperial",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then(r => r.json())
      .then(d => {
        const p = d.profile || {};
        const isMetric = p.unitSystem === "metric";
        setForm({
          name: p.name || "",
          age: p.age ? String(p.age) : "",
          weight: p.weight
            ? String(isMetric ? Math.round(p.weight) : Math.round(p.weight * 2.2046))
            : "",
          height: p.height
            ? String(isMetric ? Math.round(p.height) : Math.round(p.height / 2.54))
            : "",
          goal: p.goal || "general",
          experienceLevel: p.experienceLevel || "beginner",
          trainingDays: p.trainingDays ? String(p.trainingDays) : "4",
          equipment: p.equipment || "full_gym",
          sport: p.sport || "",
          injuries: p.injuries || "",
          unitSystem: p.unitSystem || "imperial",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const isMetric = form.unitSystem === "metric";
      const weightKg = form.weight
        ? isMetric ? parseFloat(form.weight) : parseFloat(form.weight) / 2.2046
        : null;
      const heightCm = form.height
        ? isMetric ? parseFloat(form.height) : parseFloat(form.height) * 2.54
        : null;

      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || null,
          age: form.age ? parseInt(form.age) : null,
          weight: weightKg,
          height: heightCm,
          goal: form.goal,
          experienceLevel: form.experienceLevel,
          trainingDays: parseInt(form.trainingDays),
          equipment: form.equipment,
          sport: form.sport || null,
          injuries: form.injuries || null,
          unitSystem: form.unitSystem,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function set(key: keyof ProfileForm, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  const isMetric = form.unitSystem === "metric";

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white pb-10">
      <header className="px-6 pt-8 pb-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a1a] text-neutral-400 hover:text-white"
        >
          ←
        </button>
        <h1 className="text-xl font-bold">Edit Profile</h1>
      </header>

      <form onSubmit={handleSave} className="px-6 space-y-5">
        {/* Unit toggle */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
          <div className="text-xs text-neutral-500 uppercase tracking-wide mb-3">Units</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "imperial", label: "Imperial (lbs, in)" },
              { value: "metric", label: "Metric (kg, cm)" },
            ].map(u => (
              <button
                key={u.value}
                type="button"
                onClick={() => set("unitSystem", u.value)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  form.unitSystem === u.value
                    ? "bg-[#0066FF] text-white"
                    : "bg-[#0a0a0a] text-neutral-400"
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-4">
          <div className="text-xs text-neutral-500 uppercase tracking-wide">Personal Info</div>

          <div>
            <label className="text-xs text-neutral-400">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set("name", e.target.value)}
              placeholder="Your name"
              className="mt-1.5 w-full p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-neutral-400">Age</label>
              <input
                type="number"
                value={form.age}
                onChange={e => set("age", e.target.value)}
                placeholder="25"
                className="mt-1.5 w-full p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400">Weight ({isMetric ? "kg" : "lbs"})</label>
              <input
                type="number"
                value={form.weight}
                onChange={e => set("weight", e.target.value)}
                placeholder={isMetric ? "75" : "165"}
                className="mt-1.5 w-full p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400">Height ({isMetric ? "cm" : "in"})</label>
              <input
                type="number"
                value={form.height}
                onChange={e => set("height", e.target.value)}
                placeholder={isMetric ? "175" : "70"}
                className="mt-1.5 w-full p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Training */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-4">
          <div className="text-xs text-neutral-500 uppercase tracking-wide">Training</div>

          <div>
            <label className="text-xs text-neutral-400">Goal</label>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {GOALS.map(g => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => set("goal", g.value)}
                  className={`py-2.5 px-4 rounded-xl text-sm font-medium text-left transition-all ${
                    form.goal === g.value
                      ? "bg-[#0066FF] text-white"
                      : "bg-[#0a0a0a] text-neutral-400 hover:text-white"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-400">Experience Level</label>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {EXPERIENCE.map(e => (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => set("experienceLevel", e.value)}
                  className={`py-2.5 px-4 rounded-xl text-sm font-medium text-left transition-all ${
                    form.experienceLevel === e.value
                      ? "bg-[#0066FF] text-white"
                      : "bg-[#0a0a0a] text-neutral-400 hover:text-white"
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-400">Training Days / Week</label>
            <div className="flex gap-2 mt-2">
              {["2", "3", "4", "5", "6"].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set("trainingDays", d)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    form.trainingDays === d
                      ? "bg-[#0066FF] text-white"
                      : "bg-[#0a0a0a] text-neutral-400"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-400">Equipment</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {EQUIPMENT.map(eq => (
                <button
                  key={eq.value}
                  type="button"
                  onClick={() => set("equipment", eq.value)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium text-left transition-all ${
                    form.equipment === eq.value
                      ? "bg-[#0066FF] text-white"
                      : "bg-[#0a0a0a] text-neutral-400 hover:text-white"
                  }`}
                >
                  {eq.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Additional */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-4">
          <div className="text-xs text-neutral-500 uppercase tracking-wide">Additional</div>

          <div>
            <label className="text-xs text-neutral-400">Sport / Focus (optional)</label>
            <input
              type="text"
              value={form.sport}
              onChange={e => set("sport", e.target.value)}
              placeholder="e.g. powerlifting, crossfit"
              className="mt-1.5 w-full p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-400">Injuries / Limitations (optional)</label>
            <input
              type="text"
              value={form.injuries}
              onChange={e => set("injuries", e.target.value)}
              placeholder="e.g. bad left knee, shoulder impingement"
              className="mt-1.5 w-full p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className={`w-full py-4 font-bold rounded-2xl transition-all ${
            saved
              ? "bg-[#00C853] text-white"
              : saving
              ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
              : "bg-[#0066FF] hover:bg-[#0052CC] text-white"
          }`}
        >
          {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </main>
  );
}
