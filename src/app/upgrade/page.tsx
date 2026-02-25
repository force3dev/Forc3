"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";
import { motion, AnimatePresence } from "framer-motion";

const MONTHLY_FEATURES = [
  "Unlimited AI coaching messages",
  "Advanced analytics & performance insights",
  "AI meal plans + grocery lists + restaurant mode",
  "Volume landmarks (MEV/MAV per muscle group)",
  "Training seasons (12-week goal blocks)",
  "Monthly boss battle challenges",
  "1RM calculator with history tracking",
  "Program export + sharing",
  "Priority support",
];

export default function UpgradePage() {
  const router = useRouter();
  const [plan, setPlan] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);

  async function checkout() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.comingSoon) {
        setShowWaitlist(true);
        setLoading(false);
      } else {
        setShowWaitlist(true);
        setLoading(false);
      }
    } catch {
      setShowWaitlist(true);
      setLoading(false);
    }
  }

  async function joinWaitlist() {
    if (!waitlistEmail.trim()) return;
    // Simple email collection - store in localStorage for now
    const existing = JSON.parse(localStorage.getItem("forc3_waitlist") || "[]");
    localStorage.setItem("forc3_waitlist", JSON.stringify([...existing, { email: waitlistEmail, plan, date: new Date().toISOString() }]));
    setWaitlistSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      <header className="px-5 pt-8 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-neutral-400">←</button>
        <div>
          <p className="text-xs text-neutral-500 font-semibold tracking-widest">LEVEL UP</p>
          <h1 className="text-xl font-bold">Go Premium</h1>
        </div>
      </header>

      <div className="px-5 space-y-5">
        {/* Hero */}
        <div className="bg-gradient-to-br from-[#0066FF]/20 to-[#003399]/10 border border-[#0066FF]/30 rounded-3xl p-6 text-center">
          <div className="text-5xl mb-3">🏆</div>
          <h2 className="text-2xl font-black mb-2">Unlock Everything</h2>
          <p className="text-neutral-400 text-sm">The full FORC3 experience. Unlimited coaching, advanced analytics, AI nutrition — all in.</p>
        </div>

        {/* Plan toggle */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPlan("monthly")}
            className={`p-4 rounded-2xl border text-left transition-colors ${plan === "monthly" ? "border-[#0066FF] bg-[#0066FF]/10" : "border-[#262626] bg-[#141414]"}`}
          >
            <p className="text-xs text-neutral-500 mb-1">Monthly</p>
            <p className="text-2xl font-black">$14.99</p>
            <p className="text-xs text-neutral-500">/month</p>
          </button>
          <button
            onClick={() => setPlan("annual")}
            className={`p-4 rounded-2xl border text-left transition-colors relative ${plan === "annual" ? "border-[#00C853] bg-[#00C853]/10" : "border-[#262626] bg-[#141414]"}`}
          >
            <span className="absolute -top-2 right-3 px-2 py-0.5 bg-[#00C853] text-black text-[10px] font-bold rounded-full">SAVE 45%</span>
            <p className="text-xs text-neutral-500 mb-1">Annual</p>
            <p className="text-2xl font-black">$99</p>
            <p className="text-xs text-neutral-500">/year · $8.25/mo</p>
          </button>
        </div>

        {/* Features */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
          <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-4">Everything Included</p>
          <div className="space-y-3">
            {MONTHLY_FEATURES.map(f => (
              <div key={f} className="flex items-center gap-3">
                <span className="text-[#0066FF] font-bold flex-shrink-0">✓</span>
                <span className="text-sm text-neutral-300">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={checkout}
          disabled={loading}
          className="w-full py-4 bg-[#0066FF] rounded-2xl font-bold text-lg disabled:opacity-50"
        >
          {loading ? "Loading..." : "Start 7-Day Free Trial →"}
        </button>
        <p className="text-xs text-neutral-600 text-center">Cancel anytime. No charge during trial.</p>
        <p className="text-xs text-neutral-700 text-center">
          {plan === "annual" ? "$99/year after trial" : "$14.99/month after trial"} · 100% money-back guarantee
        </p>
      </div>

      {/* Waitlist Modal */}
      <AnimatePresence>
        {showWaitlist && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-end justify-center"
            onClick={() => !waitlistSubmitted && setShowWaitlist(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-[#141414] border border-[#262626] rounded-t-3xl p-6 space-y-5"
            >
              {waitlistSubmitted ? (
                <div className="text-center py-4 space-y-3">
                  <div className="text-4xl">🎉</div>
                  <h3 className="text-xl font-bold">You're on the list!</h3>
                  <p className="text-neutral-400 text-sm">We'll email you as soon as premium launches. You'll be first.</p>
                  <button onClick={() => { setShowWaitlist(false); setWaitlistSubmitted(false); }}
                    className="w-full py-3 bg-[#0066FF] text-white font-bold rounded-xl">
                    Got it
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-3xl mb-2">⚡</div>
                    <h3 className="text-xl font-bold">Coming Soon</h3>
                    <p className="text-neutral-400 text-sm mt-1">Premium payments are launching shortly. Join the waitlist to be first and get a discount.</p>
                  </div>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={waitlistEmail}
                    onChange={e => setWaitlistEmail(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0066FF] transition-colors"
                  />
                  <button onClick={joinWaitlist}
                    className="w-full py-3 bg-[#0066FF] text-white font-bold rounded-xl">
                    Notify Me →
                  </button>
                  <button onClick={() => setShowWaitlist(false)}
                    className="w-full py-2 text-neutral-500 text-sm">
                    Maybe later
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav active="home" />
    </main>
  );
}
