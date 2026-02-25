'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FAQ = [
  { q: 'How do I cancel my subscription?', a: 'Go to Settings → Manage Subscription. You can cancel anytime and keep access until the end of your billing period.' },
  { q: 'Can I change my training goal?', a: 'Yes! Go to Settings → Profile and update your goal. Your program will regenerate to match.' },
  { q: 'Why isn\'t Apple Health connecting?', a: 'Make sure you\'ve granted FORC3 permission in Settings → Privacy → Health on your iPhone. Then reopen the app.' },
  { q: 'How do I log a custom exercise?', a: 'In the workout builder, tap "+ Add Exercise" and search. If it doesn\'t exist, tap "Create Custom" at the bottom of the search results.' },
  { q: 'Why did my streak reset?', a: 'Streaks require at least one workout or check-in per day. Rest days scheduled in your program don\'t break streaks.' },
  { q: 'How does the AI program get updated?', a: 'Your coach analyzes your performance weekly and adjusts volume, intensity, and exercise selection based on your progress and recovery data.' },
  { q: 'Can I export my data?', a: 'Yes — go to Settings → Export Data. You\'ll get a JSON file with all your workouts, nutrition logs, and progress data.' },
  { q: 'How does the recovery score work?', a: 'Recovery score combines sleep quality, sleep duration, resting heart rate (if available via Apple Health), subjective energy and soreness ratings from your morning check-in.' },
  { q: 'What\'s included in the free tier?', a: 'Free includes: AI-generated program, workout + cardio logging, basic nutrition tracking, 1 AI coach message per day, and community feed access.' },
  { q: 'How do I connect Strava?', a: 'Go to Settings → Integrations → Connect Strava. Your runs, rides, and swims will automatically sync to your FORC3 training log.' },
]

export default function SupportPage() {
  const router = useRouter()
  const [expanded, setExpanded] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  async function sendFeedback() {
    if (!feedback.trim()) return
    setSending(true)
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: feedback, type: 'support' })
    }).catch(() => {})
    setSent(true)
    setSending(false)
    setFeedback('')
  }

  return (
    <div className="min-h-dvh bg-black text-white pb-16">
      <div className="px-5 pt-8 max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-neutral-400 mb-4 block">← Back</button>
        <h1 className="text-3xl font-black mb-2">Support</h1>
        <p className="text-neutral-400 mb-8">Find answers or get in touch.</p>

        <h2 className="text-lg font-bold mb-4 text-[#0066FF]">Frequently Asked Questions</h2>
        <div className="space-y-2 mb-10">
          {FAQ.map((item, i) => (
            <button
              key={i}
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full text-left bg-[#141414] border border-[#262626] rounded-2xl p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm pr-4">{item.q}</span>
                <span className="text-neutral-500 flex-shrink-0">{expanded === i ? '−' : '+'}</span>
              </div>
              {expanded === i && (
                <p className="text-neutral-400 text-sm mt-3 leading-relaxed">{item.a}</p>
              )}
            </button>
          ))}
        </div>

        <h2 className="text-lg font-bold mb-4 text-[#0066FF]">Send Feedback</h2>
        {sent ? (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="font-bold">Thank you!</p>
            <p className="text-neutral-400 text-sm">We'll review your feedback soon.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Tell us what's on your mind..."
              rows={4}
              className="w-full bg-[#141414] border border-[#262626] rounded-2xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#0066FF] resize-none"
            />
            <button
              onClick={sendFeedback}
              disabled={!feedback.trim() || sending}
              className="w-full bg-[#0066FF] text-white font-bold py-3 rounded-2xl disabled:opacity-40"
            >
              {sending ? 'Sending...' : 'Send Feedback'}
            </button>
          </div>
        )}

        <div className="mt-10 text-center">
          <p className="text-neutral-500 text-sm">Need more help?</p>
          <a href="mailto:support@forc3.app" className="text-[#0066FF] font-semibold text-sm">support@forc3.app</a>
        </div>
      </div>
    </div>
  )
}
