'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const referralCode = searchParams.get('ref')

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setError(''); setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, email: form.email.toLowerCase().trim(), referralCode }),
      })
      const data = await res.json()

      if (!res.ok) { setError(data.error || 'Signup failed'); return }

      router.push('/onboarding')
    } catch {
      setError('Something went wrong.')
    } finally { setLoading(false) }
  }

  return (
    <div className="w-full max-w-sm">
      <Link href="/" className="block text-center text-3xl font-black mb-12 text-white">
        <span className="text-[#0066FF]">FORC</span>3
      </Link>

      {referralCode && (
        <div className="bg-green-950/50 border border-green-800 rounded-2xl p-4 mb-6 text-center">
          <p className="text-green-400 font-semibold">🎁 You got a referral bonus!</p>
          <p className="text-gray-400 text-sm mt-1">You will get 14 days free instead of 7</p>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-2 text-center text-white">Create your account</h1>
      <p className="text-gray-500 text-center mb-8">Free forever. No credit card needed.</p>

      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-2xl p-4 mb-6 text-red-400 text-sm text-center">{error}</div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        {[
          { label: 'Your name', field: 'name', type: 'text', placeholder: 'Your name' },
          { label: 'Email', field: 'email', type: 'email', placeholder: 'you@example.com' },
          { label: 'Password', field: 'password', type: 'password', placeholder: '8+ characters' },
        ].map(({ label, field, type, placeholder }) => (
          <div key={field}>
            <label className="block text-sm text-gray-400 mb-2">{label}</label>
            <input
              type={type}
              value={form[field as keyof typeof form]}
              onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
              placeholder={placeholder}
              className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#0066FF]/50 transition-colors"
              required
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 mt-2"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating account...
            </span>
          ) : 'Create Free Account →'}
        </button>
      </form>

      <p className="text-gray-600 text-xs text-center mt-6">
        By signing up you agree to our{' '}
        <Link href="/terms" className="text-gray-400 hover:text-white">Terms</Link>
        {' '}and{' '}
        <Link href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link>
      </p>

      <p className="text-center text-gray-500 text-sm mt-4">
        Have an account?{' '}
        <Link href="/login" className="text-[#0066FF] hover:text-blue-400">Sign in →</Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <SignupForm />
      </Suspense>
    </div>
  )
}
