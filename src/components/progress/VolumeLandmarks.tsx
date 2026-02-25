'use client'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const VOLUME_LANDMARKS: Record<string, { mev: number; mav: number; mrv: number }> = {
  Chest:      { mev: 8, mav: 16, mrv: 22 },
  Back:       { mev: 10, mav: 18, mrv: 25 },
  Shoulders:  { mev: 8, mav: 16, mrv: 22 },
  Quadriceps: { mev: 8, mav: 16, mrv: 20 },
  Hamstrings: { mev: 6, mav: 12, mrv: 16 },
  Glutes:     { mev: 0, mav: 12, mrv: 16 },
  Biceps:     { mev: 6, mav: 14, mrv: 20 },
  Triceps:    { mev: 6, mav: 14, mrv: 18 },
  Calves:     { mev: 6, mav: 16, mrv: 20 },
  Core:       { mev: 0, mav: 16, mrv: 20 },
}

export function VolumeLandmarks() {
  const { data } = useSWR('/api/progress/volume-landmarks', fetcher)

  // Support both response formats
  const weeklyVolumes: Record<string, number> = {}
  if (data?.volumeByMuscle) {
    Object.assign(weeklyVolumes, data.volumeByMuscle)
  } else if (data?.landmarks) {
    for (const l of data.landmarks) {
      weeklyVolumes[l.label] = l.sets
    }
  }

  return (
    <div className="bg-gray-900 rounded-3xl p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="font-bold">Weekly Volume</p>
        <span className="text-gray-600 text-xs">MEV/MAV/MRV</span>
      </div>
      <p className="text-gray-600 text-xs mb-4">Sets per muscle group this week</p>

      <div className="space-y-3">
        {Object.entries(VOLUME_LANDMARKS).map(([muscle, { mev, mav, mrv }]) => {
          const current = weeklyVolumes[muscle] || 0
          const pct = Math.min(100, (current / mrv) * 100)
          const inMEV = current >= mev
          const inMAV = current >= mav
          const overMRV = current > mrv

          const barColor = overMRV ? 'bg-red-500' : inMAV ? 'bg-purple-500' : inMEV ? 'bg-green-500' : 'bg-gray-600'

          return (
            <div key={muscle}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-300">{muscle}</span>
                <span className={`font-bold ${overMRV ? 'text-red-400' : inMAV ? 'text-purple-400' : inMEV ? 'text-green-400' : 'text-gray-500'}`}>
                  {current} sets {overMRV ? '⚠️' : inMAV ? '✓' : ''}
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden relative">
                <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                <div className="absolute top-0 bottom-0 w-px bg-yellow-500/50" style={{ left: `${(mev/mrv)*100}%` }} />
                <div className="absolute top-0 bottom-0 w-px bg-purple-500/50" style={{ left: `${(mav/mrv)*100}%` }} />
              </div>
              <div className="flex justify-between text-gray-700 text-xs mt-0.5">
                <span>MEV:{mev}</span><span>MAV:{mav}</span><span>MRV:{mrv}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-4 mt-4 text-xs text-gray-600">
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"/>MEV+</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-500 rounded-full"/>MAV+</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full"/>MRV exceeded</span>
      </div>
    </div>
  )
}
