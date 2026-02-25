'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ExportType = 'workoutLogs' | 'nutritionLogs' | 'measurements' | 'cardioLogs' | 'checkIns'

const EXPORT_OPTIONS: { key: ExportType; label: string; desc: string; emoji: string }[] = [
  { key: 'workoutLogs', label: 'Workout Logs', desc: 'Date, exercises, sets, reps, weights', emoji: '🏋️' },
  { key: 'nutritionLogs', label: 'Nutrition Logs', desc: 'Date, meal, food, macros', emoji: '🍽️' },
  { key: 'measurements', label: 'Body Measurements', desc: 'Date, weight, body fat, dimensions', emoji: '📏' },
  { key: 'cardioLogs', label: 'Cardio Logs', desc: 'Date, type, distance, duration, HR', emoji: '🏃' },
  { key: 'checkIns', label: 'Check-ins', desc: 'Date, sleep, recovery, energy', emoji: '📋' },
]

function toCSV(data: any[], headers?: string[]): string {
  if (!data || data.length === 0) return ''
  const keys = headers || Object.keys(data[0])
  const rows = data.map(item => keys.map(k => {
    const val = item[k]
    if (val === null || val === undefined) return ''
    if (typeof val === 'object') return JSON.stringify(val).replace(/"/g, '""')
    return String(val).replace(/"/g, '""')
  }).map(v => `"${v}"`).join(','))
  return [keys.join(','), ...rows].join('\n')
}

function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ExportPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<ExportType>>(new Set())
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function toggle(key: ExportType) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function exportData() {
    if (selected.size === 0) return
    setLoading(true)

    try {
      const res = await fetch('/api/export')
      const data = await res.json()

      for (const key of selected) {
        const items = data[key]
        if (items && items.length > 0) {
          const csv = toCSV(items)
          downloadCSV(`forc3_${key}_${new Date().toISOString().split('T')[0]}.csv`, csv)
        }
      }

      setDone(true)
      setTimeout(() => setDone(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-black text-white pb-32">
      <div className="px-5 pt-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400 p-2 -ml-2">←</button>
          <h1 className="text-2xl font-black">Export Data</h1>
        </div>

        <p className="text-gray-500 text-sm mb-6">Download your personal data as CSV files. Select what you want to export.</p>

        <div className="space-y-2 mb-8">
          {EXPORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => toggle(opt.key)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                selected.has(opt.key) ? 'border-green-500 bg-green-500/10' : 'border-gray-800 bg-gray-900'
              }`}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <div className="flex-1">
                <p className="font-bold text-sm">{opt.label}</p>
                <p className="text-gray-500 text-xs">{opt.desc}</p>
              </div>
              {selected.has(opt.key) && <span className="text-green-400">✓</span>}
            </button>
          ))}
        </div>

        <button
          onClick={exportData}
          disabled={selected.size === 0 || loading}
          className={`w-full font-black py-5 rounded-3xl text-xl active:scale-95 transition-all ${
            done ? 'bg-green-700 text-white' : 'bg-green-500 text-black disabled:opacity-40'
          }`}
        >
          {done ? '✓ Downloaded' : loading ? 'Exporting...' : `Export ${selected.size} file${selected.size !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}
