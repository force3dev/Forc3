"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PLANS, TRIAL_DAYS } from "@/lib/subscription/tiers";
import { useSubscription } from "@/hooks/useSubscription";

function UpgradeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tier, isInTrial } = useSubscription();
  const [loading, setLoading] = useState<"pro" | "elite" | null>(null);

  const success = searchParams.get("success");
  const cancelled = searchParams.get("cancelled");

  async function handleUpgrade(planKey: "pro" | "elite") {
    const plan = PLANS[planKey];
    if (!plan.stripePriceId) {
      alert("Stripe is not configured yet. Add STRIPE_PRO_PRICE_ID and STRIPE_ELITE_PRICE_ID to .env");
      return;
    }
    setLoading(planKey);
    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: plan.stripePriceId, tier: planKey }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to start checkout");
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white pb-12">
      <header className="px-6 pt-8 pb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-neutral-500 text-sm hover:text-white">
          ← Back
        </button>
        <div>
          <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3</div>
          <h1 className="text-2xl font-bold">Upgrade</h1>
        </div>
      </header>

      {success && (
        <div className="mx-6 mb-6 bg-[#00C853]/10 border border-[#00C853]/30 rounded-xl p-4 text-[#00C853] text-sm font-semibold">
          ✓ Subscription activated! Welcome to {tier === "elite" ? "Elite" : "Pro"}.
        </div>
      )}
      {cancelled && (
        <div className="mx-6 mb-6 bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-neutral-400 text-sm">
          Checkout cancelled. No charges were made.
        </div>
      )}

      <div className="px-6 space-y-6">
        {/* Hero */}
        <div className="text-center py-4">
          <div className="text-4xl mb-3">🚀</div>
          <h2 className="text-xl font-bold">Unlock Your Full Potential</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Try free for {TRIAL_DAYS} days — cancel anytime
          </p>
          {isInTrial && (
            <div className="mt-2 text-xs text-[#FFB300] font-semibold">
              You&apos;re currently on a free trial
            </div>
          )}
        </div>

        {/* Free tier */}
        <div className={`bg-[#141414] border ${tier === "free" && !isInTrial ? "border-[#0066FF]" : "border-[#262626]"} rounded-2xl p-5`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-bold">Free</div>
              <div className="text-2xl font-bold mt-0.5">$0</div>
            </div>
            {tier === "free" && !isInTrial && (
              <span className="text-xs bg-[#0066FF]/20 text-[#0066FF] px-3 py-1 rounded-full border border-[#0066FF]/30 font-semibold">
                Current Plan
              </span>
            )}
          </div>
          <ul className="space-y-1.5 text-sm text-neutral-400">
            {["Workout tracking", "Plate calculator", "Progression suggestions", "Basic nutrition logging"].map(f => (
              <li key={f} className="flex gap-2">
                <span className="text-neutral-600">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro tier */}
        <div className={`bg-[#141414] border ${tier === "pro" || isInTrial ? "border-[#0066FF]" : "border-[#262626]"} rounded-2xl p-5 relative overflow-hidden`}>
          <div className="absolute top-4 right-4">
            <span className="text-xs bg-[#0066FF] text-white px-2.5 py-1 rounded-full font-semibold">
              Popular
            </span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-bold">{PLANS.pro.name}</div>
              <div className="text-2xl font-bold mt-0.5">
                ${PLANS.pro.price}
                <span className="text-sm text-neutral-500 font-normal">/mo</span>
              </div>
            </div>
          </div>
          <ul className="space-y-1.5 text-sm text-neutral-400 mb-4">
            {PLANS.pro.features.map(f => (
              <li key={f} className="flex gap-2">
                <span className="text-[#0066FF]">✓</span> {f}
              </li>
            ))}
          </ul>
          {tier !== "pro" && !isInTrial ? (
            <button
              onClick={() => handleUpgrade("pro")}
              disabled={loading === "pro"}
              className="w-full py-3 bg-[#0066FF] text-white font-bold rounded-xl hover:bg-[#0052CC] transition-colors disabled:opacity-50"
            >
              {loading === "pro" ? "Loading..." : `Start ${TRIAL_DAYS}-Day Free Trial`}
            </button>
          ) : (
            <div className="w-full py-3 bg-[#0066FF]/10 text-[#0066FF] font-bold rounded-xl text-center border border-[#0066FF]/30">
              {isInTrial ? "In Trial" : "Current Plan"}
            </div>
          )}
        </div>

        {/* Elite tier */}
        <div className={`bg-[#141414] border ${tier === "elite" ? "border-[#FFB300]" : "border-[#262626]"} rounded-2xl p-5`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-bold">{PLANS.elite.name}</div>
              <div className="text-2xl font-bold mt-0.5">
                ${PLANS.elite.price}
                <span className="text-sm text-neutral-500 font-normal">/mo</span>
              </div>
            </div>
            {tier === "elite" && (
              <span className="text-xs bg-[#FFB300]/20 text-[#FFB300] px-3 py-1 rounded-full border border-[#FFB300]/30 font-semibold">
                Current Plan
              </span>
            )}
          </div>
          <ul className="space-y-1.5 text-sm text-neutral-400 mb-4">
            {PLANS.elite.features.map(f => (
              <li key={f} className="flex gap-2">
                <span className="text-[#FFB300]">✓</span> {f}
              </li>
            ))}
          </ul>
          {tier !== "elite" && (
            <button
              onClick={() => handleUpgrade("elite")}
              disabled={loading === "elite"}
              className="w-full py-3 bg-[#FFB300] text-black font-bold rounded-xl hover:bg-[#E5A000] transition-colors disabled:opacity-50"
            >
              {loading === "elite" ? "Loading..." : `Start ${TRIAL_DAYS}-Day Free Trial`}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-neutral-600">
          Secure payment via Stripe. Cancel anytime. No hidden fees.
        </p>
      </div>
    </main>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <UpgradeContent />
    </Suspense>
  );
}
