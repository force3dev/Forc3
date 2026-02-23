"use client";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";

const FEATURES = [
  { icon: "🤖", label: "Unlimited AI Coach Chat" },
  { icon: "📊", label: "Recovery Score" },
  { icon: "🏃", label: "Race Programming & Taper" },
  { icon: "🔄", label: "AI Exercise Swap" },
  { icon: "🍎", label: "Nutrition AI" },
  { icon: "✏️", label: "Customize Workouts" },
  { icon: "📈", label: "Advanced Analytics" },
  { icon: "♾️", label: "Unlimited History" },
];

export default function UpgradePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 pt-10 pb-6 text-center space-y-2">
        <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3</div>
        <h1 className="text-3xl font-bold">Go Premium</h1>
        <p className="text-neutral-400 text-sm">PhD-level coaching. Unlimited.</p>
      </div>

      <div className="px-6 space-y-5">
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-3">
          {FEATURES.map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <span className="text-xl">{f.icon}</span>
              <span className="text-sm text-neutral-200">{f.label}</span>
              <span className="ml-auto text-[#00C853] text-sm">✓</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="bg-[#0066FF]/10 border border-[#0066FF] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-lg">Yearly</div>
                <div className="text-xs text-[#0066FF] font-semibold mt-0.5">BEST VALUE — Save 45%</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#00C853]">$99</div>
                <div className="text-xs text-neutral-400">/ year</div>
              </div>
            </div>
            <button className="mt-4 w-full py-4 bg-[#0066FF] text-white font-bold rounded-xl hover:bg-[#0052CC] transition-colors">
              Get Yearly — $99/yr
            </button>
          </div>

          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-lg">Monthly</div>
                <div className="text-xs text-neutral-500 mt-0.5">Cancel anytime</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">$14.99</div>
                <div className="text-xs text-neutral-400">/ month</div>
              </div>
            </div>
            <button className="mt-4 w-full py-3 bg-[#1a1a1a] border border-[#262626] text-neutral-300 font-semibold rounded-xl hover:border-neutral-500 hover:text-white transition-colors">
              Get Monthly — $14.99/mo
            </button>
          </div>
        </div>

        <p className="text-xs text-neutral-600 text-center">
          Secure payment via Stripe. Cancel anytime.
        </p>

        <button
          onClick={() => router.back()}
          className="w-full py-3 text-neutral-500 text-sm hover:text-neutral-300 transition-colors"
        >
          ← Back
        </button>
      </div>

      <BottomNav active="home" />
    </main>
  );
}
