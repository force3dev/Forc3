'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function joinWaitlist(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, source: 'hero' }) })
      setSubmitted(true)
    } catch {} finally { setLoading(false) }
  }

  return (
    <div className="min-h-dvh bg-black text-white overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-2xl font-black tracking-tight">FORC3</span>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how" className="hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Log in</Link>
            <Link href="/signup" className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-full hover:bg-gray-100 transition-colors">Start Free</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="min-h-dvh flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-gray-300 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            AI coaching powered by Claude
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-none tracking-tighter mb-6">
            PhD-Level<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">Coaching.</span><br/>
            App Prices.
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            The only fitness app that reads your health data &mdash; sleep, HRV, heart rate &mdash; and builds a training plan that adapts to YOU every single day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/signup" className="bg-green-500 hover:bg-green-400 text-black font-bold text-lg px-8 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95">
              Start Training Free
            </Link>
            <a href="#how" className="border border-white/20 text-white font-semibold text-lg px-8 py-4 rounded-2xl hover:border-white/40 transition-all">
              See How It Works
            </a>
          </div>
          <p className="text-gray-600 text-sm">No credit card required &middot; 7-day premium trial &middot; Cancel anytime</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-16 flex flex-col items-center gap-3">
          <div className="flex -space-x-2">
            {['A','B','C','D','E'].map((letter, i) => (
              <div key={i} className="w-10 h-10 rounded-full bg-gray-800 border-2 border-black flex items-center justify-center text-sm font-bold text-gray-400">
                {letter}
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-sm">Join <span className="text-white font-semibold">2,400+ athletes</span> already training smarter</p>
        </motion.div>
      </section>

      {/* THE PROBLEM */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Generic apps give everyone<br/>
            <span className="text-red-400">the same plan.</span>
          </h2>
          <p className="text-xl text-gray-400 mb-16">
            Your training shouldn&apos;t look like everyone else&apos;s. Your body is different. Your goals are different. Your recovery is different.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: 'X', title: 'Same plan for everyone', desc: 'Push/Pull/Legs whether you sleep 4 hours or 9.' },
              { icon: '$', title: 'Trainers cost $200/hr', desc: 'Most people can only afford 1-2 sessions per month.' },
              { icon: '?', title: 'No memory, no context', desc: "Apps don't remember your injuries, PRs, or bad weeks." },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-red-950/20 border border-red-900/30 rounded-3xl p-8 text-left">
                <div className="text-4xl mb-4 font-black text-red-400">{item.icon}</div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-32 px-6 bg-gradient-to-b from-black via-green-950/10 to-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-4">FORC3 is different.</h2>
            <p className="text-xl text-gray-400">Designed from the ground up to coach you like a real athlete.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Reads your health data', desc: 'Connects to Apple Health. Sees your actual sleep, HRV, and heart rate. Adapts training based on real data.' },
              { title: 'Any goal, any athlete', desc: 'Powerlifter, marathon runner, beginner, hybrid athlete. Coach Alex builds a program specific to your exact goal.' },
              { title: 'Real structured programs', desc: 'Periodized training with progressive overload, deload weeks, taper periods. Real coaching.' },
              { title: 'Nutrition that adapts', desc: 'Macro targets change based on your training day. Coach knows you had a hard session.' },
              { title: 'Race day planning', desc: 'Tell FORC3 your race date. It builds the entire periodization right up to race day.' },
              { title: 'Remembers everything', desc: 'Injuries, PRs, preferences, setbacks. Coach Alex builds memory and references your history.' },
            ].map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 hover:border-green-500/30 transition-all">
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black">
              Up and training in<br/><span className="text-green-400">60 seconds.</span>
            </h2>
          </div>
          <div className="space-y-8">
            {[
              { step: '01', title: 'Tell FORC3 your goal', desc: 'Build muscle, lose fat, run a marathon. One question. 10 seconds.' },
              { step: '02', title: 'Get your AI program', desc: 'Claude generates a fully personalized training plan. Real exercises. Real progression.' },
              { step: '03', title: 'Connect your health data', desc: 'Link Apple Health. FORC3 reads your sleep and recovery and adjusts automatically.' },
              { step: '04', title: 'Train and level up', desc: 'Log workouts, chat with Coach Alex, track PRs, earn XP. The coach gets smarter over time.' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex gap-6 items-start">
                <span className="text-5xl font-black text-white/10 leading-none mt-1 w-16 shrink-0">{item.step}</span>
                <div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-4">Simple pricing.</h2>
          <p className="text-xl text-gray-400 mb-16">Start free. Upgrade when you&apos;re ready.</p>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 text-left">
              <div className="text-gray-400 text-sm font-semibold mb-2">FREE FOREVER</div>
              <div className="text-4xl font-black mb-1">$0</div>
              <div className="text-gray-500 text-sm mb-8">No credit card needed</div>
              <ul className="space-y-3 text-sm text-gray-300">
                {['AI-generated training plan', '1 coach message per day', 'Basic workout logging', 'Exercise library', 'Streak tracking'].map(f => (
                  <li key={f} className="flex gap-3 items-center"><span className="text-green-400">&#10003;</span>{f}</li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 block text-center border border-white/20 text-white font-semibold py-3 rounded-2xl hover:border-white/40 transition-colors">
                Get Started Free
              </Link>
            </div>
            <div className="bg-gradient-to-br from-green-950/50 to-emerald-950/30 border border-green-500/30 rounded-3xl p-8 text-left relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</div>
              <div className="text-green-400 text-sm font-semibold mb-2">PREMIUM</div>
              <div className="text-4xl font-black mb-1">$14.99<span className="text-lg font-normal text-gray-400">/mo</span></div>
              <div className="text-gray-500 text-sm mb-8">or $99/yr &middot; save 45%</div>
              <ul className="space-y-3 text-sm text-gray-300">
                {['Everything in Free', 'Unlimited AI coaching', 'Weekly program updates', 'Recovery score + health sync', 'Race day programming', 'Full nutrition AI', 'Injury prevention alerts', 'Progress photos + analysis', 'Priority support'].map(f => (
                  <li key={f} className="flex gap-3 items-center"><span className="text-green-400">&#10003;</span>{f}</li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 block text-center bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-2xl transition-all hover:scale-105">
                Start 7-Day Free Trial
              </Link>
            </div>
          </div>
          <p className="text-gray-600 text-sm mt-6">No commitment. Cancel anytime.</p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-black mb-6">
            Ready to train<br/><span className="text-green-400">like an elite?</span>
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            Join thousands of athletes using AI to train smarter, recover better, and hit goals faster.
          </p>
          {!submitted ? (
            <form onSubmit={joinWaitlist} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6">
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-white/5 border border-white/[0.15] rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
                required
              />
              <button type="submit" disabled={loading} className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold px-8 py-4 rounded-2xl transition-all whitespace-nowrap">
                {loading ? '...' : 'Start Free'}
              </button>
            </form>
          ) : (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 max-w-md mx-auto mb-6">
              <p className="text-green-400 font-semibold">You&apos;re in! Check your email.</p>
              <p className="text-gray-400 text-sm mt-1">Or go straight to <Link href="/signup" className="text-green-400 underline">create your account</Link></p>
            </div>
          )}
          <Link href="/signup" className="text-gray-500 text-sm hover:text-white transition-colors underline">
            Or create your free account now
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-2xl font-black">FORC3</span>
          <div className="flex gap-8 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <a href="mailto:support@forc3.app" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-gray-600 text-sm">&copy; 2025 FORC3. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
