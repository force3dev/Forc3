"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";

const FEATURES = [
  { icon: "🧠", title: "AI Coaching", desc: "Real conversation with Claude — your workouts, your history, your goals." },
  { icon: "📈", title: "Progressive Overload", desc: "Every session auto-adjusts: add weight, hold, or deload based on your performance." },
  { icon: "🔍", title: "Food Database", desc: "Search 2M+ foods via USDA + OpenFoodFacts, or describe a meal for instant AI estimates." },
  { icon: "🏆", title: "Achievement System", desc: "12 milestones tracking PRs, streaks, volume, and consistency." },
  { icon: "📊", title: "Analytics", desc: "Volume trends, strength curves, compliance heatmap — know exactly where you stand." },
  { icon: "⚡", title: "Smart Progression", desc: "Automatically suggests deloads, progressive overload, and exercise swaps." },
];

const SCIENCE = [
  "Progressive overload via double progression (reps → weight)",
  "Deload every 4–6 weeks for recovery and adaptation",
  "Protein targets based on lean mass × 0.8–1g/lb",
  "RPE-based auto-regulation for effort management",
  "Periodization aligned to your weekly training frequency",
  "Recovery signals from volume, RPE trends, and nutrition data",
];

export default function AboutPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black text-white pb-10">
      <header className="px-6 pt-8 pb-6 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a1a] text-neutral-400 hover:text-white"
        >
          ←
        </button>
        <div>
          <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3</div>
          <h1 className="text-xl font-bold mt-0.5">About</h1>
        </div>
      </header>

      <div className="px-6 space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-br from-[#0066FF]/20 to-[#0a0a0a] border border-[#0066FF]/20 rounded-3xl p-6 text-center">
          <div className="text-5xl mb-4">💪</div>
          <h2 className="text-2xl font-bold mb-2">FORC3</h2>
          <p className="text-neutral-400 text-sm leading-relaxed max-w-xs mx-auto">
            PhD-level fitness coaching at app prices. Evidence-based training with real AI intelligence built in.
          </p>
        </div>

        {/* Features */}
        <div>
          <h3 className="font-bold text-lg mb-3">What Makes FORC3 Different</h3>
          <div className="space-y-3">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-[#141414] border border-[#262626] rounded-2xl p-4 flex gap-4">
                <div className="text-2xl mt-0.5">{f.icon}</div>
                <div>
                  <div className="font-semibold text-sm">{f.title}</div>
                  <div className="text-xs text-neutral-400 mt-1 leading-relaxed">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Science */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
          <h3 className="font-bold mb-4">The Science Behind It</h3>
          <div className="space-y-2.5">
            {SCIENCE.map(s => (
              <div key={s} className="flex gap-3 text-sm">
                <span className="text-[#0066FF] mt-0.5 flex-shrink-0">→</span>
                <span className="text-neutral-300">{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Powered by */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
          <h3 className="font-bold mb-4">Powered By</h3>
          <div className="space-y-3">
            {[
              { name: "Anthropic Claude", role: "AI Coaching + Nutrition Estimation", color: "#FF6B35" },
              { name: "USDA FoodData Central", role: "US food nutrition database", color: "#00C853" },
              { name: "OpenFoodFacts", role: "Global packaged food database", color: "#0066FF" },
            ].map(p => (
              <div key={p.name} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                <div>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-neutral-500">{p.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="flex items-center justify-center w-full py-4 bg-[#0066FF] text-white font-bold rounded-2xl hover:bg-[#0052CC] transition-colors"
        >
          Back to Training
        </Link>
      </div>
    </main>
  );
}
