import Link from "next/link";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "FORC3 — AI Hybrid Athlete Coach",
  description: "PhD-Level Coaching at App Prices. AI that reads your training data and adapts your program every single day.",
};

const FEATURES = [
  { icon: "🧠", title: "AI That Knows You", desc: "Coach Alex reads your workout history, recovery data, and performance trends to give genuinely personalized advice — not generic tips." },
  { icon: "⚡", title: "Hybrid Training Built In", desc: "Strength + cardio in one plan. Whether you're training for a marathon, powerlifting meet, or just want to look good — FORC3 builds the right blend." },
  { icon: "📊", title: "Real-Time Adaptation", desc: "Your RPE too high? Coach adjusts next week automatically. Stalling on squats? Gets flagged and addressed. Training actually responds to you." },
  { icon: "🍽️", title: "Nutrition That Matches Training", desc: "AI meal plans calibrated to your exact macros. Restaurant mode, grocery lists, and barcode scanning — nutrition made effortless." },
  { icon: "🏆", title: "Gamified Progress", desc: "XP, levels, streaks, boss battles, training seasons. Fitness app meets RPG — staying consistent has never felt this good." },
  { icon: "👥", title: "Community That Pushes You", desc: "Follow athletes with similar goals. Share PRs, react to workouts, send messages. Accountability built into every session." },
];

export default async function LandingPage() {
  const session = await getSession();
  if (session?.userId) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="px-6 py-5 flex items-center justify-between border-b border-[#1a1a1a]">
        <div className="font-black text-xl tracking-tight">
          <span className="text-[#0066FF]">FORC</span>3
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-neutral-400 hover:text-white transition-colors">Log in</Link>
          <Link href="/signup" className="px-4 py-2 bg-[#0066FF] rounded-xl text-sm font-semibold hover:bg-[#0052CC] transition-colors">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-20 pb-16 text-center max-w-2xl mx-auto">
        <div className="inline-block px-3 py-1 bg-[#0066FF]/10 border border-[#0066FF]/30 rounded-full text-xs text-[#0066FF] font-semibold mb-6">
          AI-Powered Fitness Coach
        </div>
        <h1 className="text-4xl font-black leading-tight mb-6">
          PhD-Level Coaching<br />
          <span className="text-[#0066FF]">at App Prices</span>
        </h1>
        <p className="text-neutral-400 text-lg mb-8 leading-relaxed">
          The AI coach that actually reads your data. Adapts your training daily. Knows when to push and when to back off.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="px-8 py-4 bg-[#0066FF] rounded-2xl font-bold text-lg hover:bg-[#0052CC] transition-colors"
          >
            Start Training Free →
          </Link>
          <Link href="/login" className="px-8 py-4 bg-[#141414] border border-[#262626] rounded-2xl font-semibold text-neutral-300 hover:text-white transition-colors">
            I have an account
          </Link>
        </div>
        <p className="text-xs text-neutral-600 mt-4">No credit card required. Free forever for core features.</p>
      </section>

      {/* Problem */}
      <section className="px-6 py-16 bg-[#0a0a0a] border-y border-[#1a1a1a]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-black mb-6">The Problem With Every Other App</h2>
          <div className="grid grid-cols-1 gap-4 text-left">
            {[
              { icon: "❌", text: "Generic plans that ignore your actual performance" },
              { icon: "❌", text: "Personal trainers cost $100–300 per session" },
              { icon: "❌", text: "Apps that track but never actually coach you" },
              { icon: "❌", text: "Nutrition advice disconnected from your training load" },
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#141414] border border-[#262626] rounded-xl p-4">
                <span className="text-xl flex-shrink-0">{p.icon}</span>
                <p className="text-neutral-300 text-sm">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-10">Everything You Need to Level Up</h2>
          <div className="grid grid-cols-1 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <span className="text-3xl flex-shrink-0">{f.icon}</span>
                  <div>
                    <h3 className="font-bold mb-1">{f.title}</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-16 bg-[#0a0a0a] border-y border-[#1a1a1a]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-black mb-3">Simple Pricing</h2>
          <p className="text-neutral-400 mb-10">Start free. Upgrade when you're ready to go deeper.</p>
          <div className="grid grid-cols-1 gap-5">
            {/* Free */}
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 text-left">
              <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-2">Free Forever</p>
              <p className="text-3xl font-black mb-4">$0</p>
              <ul className="space-y-2 text-sm text-neutral-300 mb-6">
                {["AI-generated training program", "Strength + cardio tracking", "Basic nutrition logging", "1 AI coach message per day", "Community feed"].map(f => (
                  <li key={f} className="flex items-center gap-2"><span className="text-[#00C853]">✓</span>{f}</li>
                ))}
              </ul>
              <Link href="/signup" className="block w-full py-3 border border-[#262626] rounded-xl text-center font-semibold text-neutral-300 hover:text-white hover:border-neutral-400 transition-colors">
                Get Started
              </Link>
            </div>
            {/* Premium */}
            <div className="bg-gradient-to-br from-[#0066FF]/20 to-[#003399]/10 border border-[#0066FF]/40 rounded-2xl p-6 text-left relative">
              <span className="absolute -top-3 left-6 px-3 py-1 bg-[#0066FF] rounded-full text-xs font-bold">MOST POPULAR</span>
              <p className="text-xs text-[#8bb7ff] uppercase tracking-widest font-semibold mb-2">Premium</p>
              <div className="flex items-baseline gap-2 mb-4">
                <p className="text-3xl font-black">$14.99</p>
                <span className="text-neutral-400">/month</span>
              </div>
              <ul className="space-y-2 text-sm text-neutral-300 mb-6">
                {[
                  "Everything in Free",
                  "Unlimited AI coaching",
                  "Advanced analytics & insights",
                  "AI meal plans + grocery lists",
                  "Volume landmarks (MEV/MAV)",
                  "Training seasons & boss battles",
                  "Program export + PDF",
                  "Priority support",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2"><span className="text-[#0066FF]">✓</span>{f}</li>
                ))}
              </ul>
              <Link href="/signup" className="block w-full py-3 bg-[#0066FF] rounded-xl text-center font-bold hover:bg-[#0052CC] transition-colors">
                Start 7-Day Free Trial →
              </Link>
              <p className="text-xs text-neutral-500 mt-2 text-center">No credit card required for trial</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-3xl font-black mb-4">Your Best Training Starts Today</h2>
        <p className="text-neutral-400 mb-8">Join athletes building their best physique and performance with FORC3.</p>
        <Link href="/signup" className="inline-block px-10 py-4 bg-[#0066FF] rounded-2xl font-bold text-lg hover:bg-[#0052CC] transition-colors">
          Start Training Free →
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-[#1a1a1a] flex items-center justify-between text-xs text-neutral-600">
        <p><span className="text-[#0066FF] font-bold">FORC3</span> © 2025</p>
        <div className="flex gap-4">
          <Link href="/about" className="hover:text-neutral-400 transition-colors">About</Link>
          <Link href="/privacy" className="hover:text-neutral-400 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-neutral-400 transition-colors">Terms</Link>
        </div>
      </footer>
    </main>
  );
}
