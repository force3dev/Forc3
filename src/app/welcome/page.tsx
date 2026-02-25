'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, Suspense } from 'react'

function WelcomeContent() {
  const params = useSearchParams()
  const upgraded = params.get('upgraded') === 'true'

  useEffect(() => {
    if (upgraded) {
      import('canvas-confetti').then(mod => {
        mod.default({ particleCount: 200, spread: 70, origin: { y: 0.6 }, colors: ['#0066FF', '#fff', '#93c5fd'] })
      }).catch(() => {})
    }
  }, [upgraded])

  return (
    <div className="min-h-dvh bg-black text-white flex flex-col items-center justify-center px-8 text-center">
      <span className="text-8xl mb-6">{upgraded ? '🎉' : '💪'}</span>
      <h1 className="text-4xl font-black mb-4">
        {upgraded ? "You're Premium!" : "Welcome to FORC3"}
      </h1>
      <p className="text-neutral-400 text-xl mb-10 max-w-sm">
        {upgraded
          ? "All premium features unlocked. Your coach is ready. Let's build something."
          : "Your program is being built. Coach Alex is ready for you."
        }
      </p>
      <Link href="/dashboard" className="bg-[#0066FF] text-white font-black text-xl px-10 py-5 rounded-3xl active:scale-95 transition-transform">
        Go to Dashboard →
      </Link>
    </div>
  )
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-black" />}>
      <WelcomeContent />
    </Suspense>
  )
}
