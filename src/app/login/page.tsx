'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      if (data.user?.onboardingDone === false || data.onboardingDone === false) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-3xl font-black mb-12 text-white">
          <span className="text-[#0066FF]">FORC</span>3
        </Link>

        <h1 className="text-2xl font-bold mb-2 text-center text-white">Welcome back</h1>
        <p className="text-gray-500 text-center mb-8">Sign in to continue training</p>

        {error && (
          <div className="bg-red-950/50 border border-red-800 rounded-2xl p-4 mb-6 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#0066FF]/50 transition-colors"
              required
            />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-400">Password</label>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#0066FF]/50 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-8">
          No account?{' '}
          <Link href="/signup" className="text-[#0066FF] hover:text-blue-400">Create one free →</Link>
        </p>
      </div>
    </div>
  )
}
