'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateChallenge() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    type: 'volume',
    target: '',
    duration: 7,
    isTeam: false,
    teamSize: 2,
    inviteUsernames: [''],
  })
  const [creating, setCreating] = useState(false)

  const CHALLENGE_TYPES = [
    { value: 'volume',   label: 'Total Volume', desc: 'Combined lbs lifted', emoji: '🏋️' },
    { value: 'workouts', label: 'Most Workouts', desc: 'Who trains most often', emoji: '📅' },
    { value: 'cardio',   label: 'Most Distance', desc: 'Total km run/biked/swum', emoji: '🏃' },
    { value: 'streak',   label: 'Consistency',  desc: 'Longest training streak', emoji: '🔥' },
  ]

  async function create() {
    if (!form.name || !form.target) return
    setCreating(true)

    const res = await fetch('/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()

    if (data.challengeId) {
      router.push(`/challenges/${data.challengeId}`)
    }
    setCreating(false)
  }

  return (
    <div className="min-h-dvh bg-black text-white pb-32">
      <div className="px-5 pt-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400 p-2 -ml-2">←</button>
          <h1 className="text-2xl font-black">Create Challenge</h1>
        </div>

        {/* Challenge name */}
        <div className="mb-5">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Challenge Name</p>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Who trains harder: me or Marcus?"
            className="w-full bg-gray-900 rounded-2xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none text-base"
          />
        </div>

        {/* Type */}
        <div className="mb-5">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Challenge Type</p>
          <div className="grid grid-cols-2 gap-2">
            {CHALLENGE_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setForm(f => ({ ...f, type: t.value }))}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${form.type === t.value ? 'border-green-500 bg-green-500/10' : 'border-gray-800 bg-gray-900'}`}
              >
                <span className="text-2xl">{t.emoji}</span>
                <p className="font-bold text-sm mt-1">{t.label}</p>
                <p className="text-gray-500 text-xs">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Target + Duration */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-gray-900 rounded-2xl p-4">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Target</p>
            <input
              value={form.target}
              onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
              placeholder={form.type === 'volume' ? '100000' : form.type === 'workouts' ? '5' : '30'}
              className="bg-transparent text-2xl font-black text-white focus:outline-none w-full"
              type="number"
              inputMode="numeric"
            />
            <p className="text-gray-600 text-xs mt-1">
              {form.type === 'volume' ? 'lbs' : form.type === 'workouts' ? 'workouts' : form.type === 'cardio' ? 'km' : 'days'}
            </p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-4">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Duration</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setForm(f => ({ ...f, duration: Math.max(1, f.duration - 1) }))} className="text-gray-500 text-xl font-bold">−</button>
              <span className="font-black text-2xl flex-1 text-center">{form.duration}</span>
              <button onClick={() => setForm(f => ({ ...f, duration: Math.min(30, f.duration + 1) }))} className="text-green-400 text-xl font-bold">+</button>
            </div>
            <p className="text-gray-600 text-xs text-center mt-1">days</p>
          </div>
        </div>

        {/* Invite */}
        <div className="mb-8">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Invite Opponents</p>
          {form.inviteUsernames.map((username, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                value={username}
                onChange={e => {
                  const next = [...form.inviteUsernames]
                  next[i] = e.target.value
                  setForm(f => ({ ...f, inviteUsernames: next }))
                }}
                placeholder="@username"
                className="flex-1 bg-gray-900 rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none"
              />
              {i === form.inviteUsernames.length - 1 && (
                <button
                  onClick={() => setForm(f => ({ ...f, inviteUsernames: [...f.inviteUsernames, ''] }))}
                  className="bg-gray-800 rounded-2xl px-4 text-green-400 font-bold"
                >
                  +
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={create}
          disabled={creating || !form.name}
          className="w-full bg-green-500 disabled:opacity-40 text-black font-black py-5 rounded-3xl text-xl active:scale-95 transition-all"
        >
          {creating ? 'Creating...' : 'Launch Challenge 🏆'}
        </button>
      </div>
    </div>
  )
}
