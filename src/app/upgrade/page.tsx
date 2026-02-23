"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";

const FREE_FEATURES = [
  "✓ AI-generated training program",
  "✓ 1 daily coach message",
  "✓ Basic workout tracking",
  "✓ Apple Health check-in",
  "✗ Unlimited AI coaching",
  "✗ Race programming",
  "✗ Recovery score",
  "✗ Nutrition AI coach",
];

const PREMIUM_FEATURES = [
  "✓ Everything in Free",
  "✓ Unlimited AI coach chat",
  "✓ Adaptive program, updates weekly",
  "✓ Race-specific programming + taper",
  "✓ Recovery score",
  "✓ AI Exercise swap",
  "✓ Strava + Apple Health full sync",
  "✓ Nutrition AI coach",
  "✓ Injury prevention alerts",
  "✓ Progress photo tracking",
  "✓ Priority support",
  "⭐ 7-day free trial",
];

// TODO: replace with real testimonials
const TESTIMONIALS = [
  { name: "Marcus T.", text: "Cut 12 lbs while hitting a deadlift PR. Coach Alex actually adjusts when life gets in the way.", role: "Marathon runner" },
  { name: "Sarah K.", text: "Trained for my first Ironman without an expensive coach. The race programming was spot-on.", role: "Triathlete" },
  { name: "James R.", text: "Streak is at 47 days. The daily check-ins keep me accountable like nothing else.", role: "Hybrid athlete" },
];

export default function UpgradePage() {
  const router = useRouter();
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const priceId = billing === "annual"
        ? process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID;

      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: priceId || "price_placeholder", tier: "premium" }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert("Unable to start checkout. Please try again.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="px-6 pt-10 pb-6 text-center space-y-2">
        <div className="text-xs font-bold tracking-widest text-[#0066FF]">⚡ FORC3</div>
        <h1 className="text-3xl font-bold">Unlock Your Full Potential</h1>
        <p className="text-neutral-400 text-sm">PhD-Level Coaching at App Prices</p>
      </div>

      <div className="px-6 space-y-6 max-w-lg mx-auto">
        {/* Billing toggle */}
        <div className="flex bg-[#141414] rounded-2xl p-1 border border-[#262626]">
          <button
            onClick={() => setBilling("monthly")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              billing === "monthly" ? "bg-[#1a1a1a] text-white" : "text-neutral-500"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              billing === "annual" ? "bg-[#0066FF] text-white" : "text-neutral-500"
            }`}
          >
            Annual <span className="text-xs text-[#00C853]">Save 45%</span>
          </button>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Free */}
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-3">
            <div>
              <div className="font-bold text-lg">Free</div>
              <div className="text-3xl font-black mt-1">$0<span className="text-sm font-normal text-neutral-400">/mo</span></div>
            </div>
            <div className="space-y-2">
              {FREE_FEATURES.map(f => (
                <div key={f} className={`text-xs ${f.startsWith("✗") ? "text-neutral-600" : "text-neutral-300"}`}>{f}</div>
              ))}
            </div>
          </div>

          {/* Premium */}
          <div className="bg-gradient-to-br from-[#0066FF]/10 to-[#00C853]/10 border border-[#0066FF] rounded-2xl p-5 space-y-3 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00C853] text-black text-xs font-bold px-3 py-1 rounded-full">
              RECOMMENDED
            </div>
            <div>
              <div className="font-bold text-lg">Premium</div>
              {billing === "annual" ? (
                <div>
                  <div className="text-3xl font-black mt-1 text-[#00C853]">$8.25<span className="text-sm font-normal text-neutral-400">/mo</span></div>
                  <div className="text-xs text-neutral-400">Billed $99/year</div>
                </div>
              ) : (
                <div className="text-3xl font-black mt-1">$14.99<span className="text-sm font-normal text-neutral-400">/mo</span></div>
              )}
            </div>
            <div className="space-y-2">
              {PREMIUM_FEATURES.map(f => (
                <div key={f} className="text-xs text-neutral-300">{f}</div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full py-5 bg-[#00C853] text-black font-black text-lg rounded-2xl hover:bg-[#00B048] transition-colors disabled:opacity-50"
        >
          {loading ? "Loading..." : "Start Free Trial →"}
        </button>
        <p className="text-xs text-neutral-600 text-center">
          7-day free trial. Cancel anytime. No questions asked.
        </p>

        {/* Social proof */}
        <div className="space-y-3 pt-4">
          <h3 className="text-center text-sm font-bold text-neutral-400">
            Join thousands of hybrid athletes training smarter
          </h3>
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="bg-[#141414] border border-[#262626] rounded-2xl p-4 space-y-2">
              <p className="text-sm text-neutral-300 italic">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#0066FF] rounded-full flex items-center justify-center text-xs font-bold">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-xs font-semibold">{t.name}</div>
                  <div className="text-xs text-neutral-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

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
