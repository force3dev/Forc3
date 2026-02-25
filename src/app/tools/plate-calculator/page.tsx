'use client'
import { useState } from 'react'
import Link from 'next/link'

const BAR_TYPES = [
  { name: 'Olympic Bar', weight: 45 },
  { name: 'EZ Curl Bar', weight: 25 },
  { name: 'Hex/Trap Bar', weight: 60 },
  { name: 'Safety Bar', weight: 65 },
  { name: 'Axle Bar', weight: 45 },
]

const PLATE_WEIGHTS = [45, 35, 25, 10, 5, 2.5, 1.25]

function calculatePlates(targetWeight: number, barWeight: number) {
  const perSide = (targetWeight - barWeight) / 2
  if (perSide < 0) return null

  const plates: { weight: number; count: number }[] = []
  let remaining = perSide

  for (const plate of PLATE_WEIGHTS) {
    const count = Math.floor(remaining / plate)
    if (count > 0) {
      plates.push({ weight: plate, count })
      remaining -= count * plate
      remaining = Math.round(remaining * 100) / 100
    }
  }

  if (remaining > 0.01) return null // Can't make exact weight
  return plates
}

export default function PlateCalculatorPage() {
  const [targetWeight, setTargetWeight] = useState('')
  const [selectedBar, setSelectedBar] = useState(BAR_TYPES[0])
  const [unit, setUnit] = useState<'lbs' | 'kg'>('lbs')

  const target = parseFloat(targetWeight) || 0
  const plates = target > 0 ? calculatePlates(target, selectedBar.weight) : null
  const perSide = plates ? (target - selectedBar.weight) / 2 : 0

  // Common weight presets
  const presets = [45, 95, 135, 155, 185, 205, 225, 245, 275, 315, 365, 405]

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 bg-black/90 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <Link href="/tools/1rm" className="text-gray-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="font-bold text-lg">Plate Calculator</h1>
          <p className="text-gray-500 text-xs">Figure out exactly what plates to load</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Bar Type */}
        <div>
          <label className="text-sm text-gray-400 font-semibold uppercase tracking-widest block mb-3">Bar Type</label>
          <div className="grid grid-cols-2 gap-2">
            {BAR_TYPES.map(bar => (
              <button
                key={bar.name}
                onClick={() => setSelectedBar(bar)}
                className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all text-left ${
                  selectedBar.name === bar.name
                    ? 'bg-[#0066FF] text-white'
                    : 'bg-gray-900 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                <div>{bar.name}</div>
                <div className="text-xs opacity-70">{bar.weight} lbs</div>
              </button>
            ))}
          </div>
        </div>

        {/* Target Weight */}
        <div>
          <label className="text-sm text-gray-400 font-semibold uppercase tracking-widest block mb-3">Target Weight</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={targetWeight}
              onChange={e => setTargetWeight(e.target.value)}
              placeholder={`e.g. 185`}
              className="flex-1 bg-gray-900 border border-white/10 rounded-xl px-4 py-4 text-white text-xl font-bold placeholder-gray-700 focus:outline-none focus:border-[#0066FF]/50"
            />
            <div className="bg-gray-900 border border-white/10 rounded-xl px-4 py-4 text-gray-400 font-semibold">
              {unit}
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-2 mt-3">
            {presets.map(w => (
              <button
                key={w}
                onClick={() => setTargetWeight(w.toString())}
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  parseFloat(targetWeight) === w
                    ? 'bg-[#0066FF] text-white'
                    : 'bg-gray-900 text-gray-500 hover:text-white border border-white/5'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Result */}
        {target > 0 && (
          <div className={`rounded-2xl p-5 border ${plates ? 'bg-gray-900/50 border-white/10' : 'bg-red-950/20 border-red-900/30'}`}>
            {plates ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg">{target} lbs</h2>
                  <span className="text-gray-500 text-sm">Bar: {selectedBar.weight} lbs</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-2">
                      Each Side ({perSide} lbs)
                    </p>
                    {plates.length === 0 ? (
                      <p className="text-gray-500 text-sm">Bar only — no plates needed</p>
                    ) : (
                      <div className="space-y-2">
                        {plates.map(({ weight, count }) => (
                          <div key={weight} className="flex items-center justify-between bg-black/40 rounded-xl px-4 py-3">
                            <span className="font-bold text-white">{weight} lb plate</span>
                            <span className="text-[#0066FF] font-bold">×{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Visual plate order */}
                  {plates.length > 0 && (
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-2">
                        Load Order (outside → in)
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {[...plates].reverse().flatMap(({ weight, count }) =>
                          Array(count).fill(null).map((_, i) => (
                            <div
                              key={`${weight}-${i}`}
                              className="bg-gray-700 border border-white/20 rounded-lg px-2 py-1 text-xs font-bold text-white"
                            >
                              {weight}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                    <span className="text-gray-500 text-sm">Total = Bar ({selectedBar.weight}) + ({perSide} × 2)</span>
                    <span className="font-bold text-green-400">= {target} lbs ✓</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-red-400 font-semibold">Cannot make {target} lbs</p>
                <p className="text-gray-500 text-sm mt-1">
                  {target <= selectedBar.weight
                    ? `Target must be greater than bar weight (${selectedBar.weight} lbs)`
                    : `${perSide} lbs per side cannot be made with standard plates`
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {!target && (
          <div className="text-center py-12 text-gray-600">
            <div className="text-5xl mb-4">🏋️</div>
            <p className="font-semibold mb-1">Enter a target weight</p>
            <p className="text-sm">See exactly which plates to load</p>
          </div>
        )}
      </div>
    </div>
  )
}
