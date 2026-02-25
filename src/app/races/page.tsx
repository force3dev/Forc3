'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/shared/BottomNav'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const RACE_TYPES = [
  { value: '5K', label: '5K' },
  { value: '10K', label: '10K' },
  { value: 'Half Marathon', label: 'Half Marathon' },
  { value: 'Marathon', label: 'Marathon' },
  { value: 'Sprint Triathlon', label: 'Sprint Tri' },
  { value: 'Olympic Triathlon', label: 'Olympic Tri' },
  { value: 'Half Ironman (70.3)', label: '70.3' },
  { value: 'Ironman', label: 'Ironman' },
  { value: 'Spartan / OCR', label: 'OCR' },
  { value: 'Cycling Event', label: 'Cycling' },
  { value: 'Swimming Event', label: 'Swimming' },
  { value: 'Custom', label: 'Custom' },
]

export default function RacesPage() {
  const router = useRouter()
  const { data, mutate } = useSWR('/api/races', fetcher)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ raceName: '', raceType: '5K', raceDate: '', targetTime: '' })
  const [saving, setSaving] = useState(false)

  const races = data?.races || []

  async function addRace() {
    if (!form.raceDate || !form.raceType) return
    setSaving(true)
    await fetch('/api/races', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setShowAdd(false)
    setForm({ raceName: '', raceType: '5K', raceDate: '', targetTime: '' })
    setSaving(false)
    mutate()
  }

  async function deleteRace(id: string) {
    await fetch(`/api/races?id=${id}`, { method: 'DELETE' })
    mutate()
  }

  function daysUntil(date: string) {
    return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="min-h-dvh bg-black text-white pb-28">
      <div className="px-5 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => router.back()} className="text-neutral-400 text-sm mb-1 block">← Back</button>
            <h1 className="text-2xl font-black">Race Goals</h1>
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-[#0066FF] text-white font-bold text-sm px-4 py-2.5 rounded-2xl">
            + Add Race
          </button>
        </div>

        {races.length === 0 && !showAdd ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🏁</p>
            <p className="text-xl font-bold mb-2">No races scheduled</p>
            <p className="text-neutral-400 mb-6">Add a race and FORC3 will build your training around it</p>
            <button onClick={() => setShowAdd(true)} className="bg-[#0066FF] text-white font-bold px-8 py-4 rounded-2xl">
              Add First Race →
            </button>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {races.map((race: any) => {
              const days = daysUntil(race.raceDate)
              const isPast = days < 0
              return (
                <div key={race.id} className={`rounded-2xl p-5 border ${isPast ? 'bg-[#141414]/40 border-[#262626] opacity-60' : 'bg-[#141414] border-[#262626]'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-black text-lg">{race.raceName || race.raceType}</p>
                      <p className="text-neutral-500 text-sm">{race.raceType} · {new Date(race.raceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      {race.targetTime && <p className="text-[#0066FF] text-xs mt-1">Goal: {race.targetTime}</p>}
                    </div>
                    <div className="text-right">
                      {isPast ? (
                        <span className="text-neutral-500 text-sm">Completed</span>
                      ) : (
                        <>
                          <p className="text-3xl font-black text-white">{days}</p>
                          <p className="text-neutral-500 text-xs">days left</p>
                        </>
                      )}
                    </div>
                  </div>
                  <button onClick={() => deleteRace(race.id)} className="text-neutral-700 text-xs mt-3 active:text-red-400">
                    Remove
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {showAdd && (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
            <h2 className="font-black text-xl mb-4">Add Race</h2>
            <div className="mb-4">
              <p className="text-neutral-500 text-xs uppercase tracking-wider mb-2">Race Name (optional)</p>
              <input
                value={form.raceName}
                onChange={e => setForm(f => ({ ...f, raceName: e.target.value }))}
                placeholder="e.g. Boston Marathon"
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#0066FF]"
              />
            </div>
            <div className="mb-4">
              <p className="text-neutral-500 text-xs uppercase tracking-wider mb-2">Race Type</p>
              <div className="grid grid-cols-3 gap-2">
                {RACE_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setForm(f => ({ ...f, raceType: t.value }))}
                    className={`py-3 rounded-xl text-xs font-bold border transition-all ${form.raceType === t.value ? 'border-[#0066FF] bg-[#0066FF]/10 text-white' : 'border-[#262626] text-neutral-400'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-neutral-500 text-xs uppercase tracking-wider mb-2">Race Date</p>
                <input
                  type="date"
                  value={form.raceDate}
                  onChange={e => setForm(f => ({ ...f, raceDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0066FF]"
                />
              </div>
              <div>
                <p className="text-neutral-500 text-xs uppercase tracking-wider mb-2">Target Time</p>
                <input
                  value={form.targetTime}
                  onChange={e => setForm(f => ({ ...f, targetTime: e.target.value }))}
                  placeholder="e.g. sub 4:00"
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#0066FF]"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 border border-[#262626] text-neutral-400 py-4 rounded-xl font-bold">
                Cancel
              </button>
              <button
                onClick={addRace}
                disabled={!form.raceDate || saving}
                className="flex-1 bg-[#0066FF] disabled:opacity-40 text-white font-bold py-4 rounded-xl active:scale-95 transition-all"
              >
                {saving ? 'Saving...' : 'Add Race'}
              </button>
            </div>
          </div>
        )}
      </div>
      <BottomNav active="profile" />
    </div>
  )
}
