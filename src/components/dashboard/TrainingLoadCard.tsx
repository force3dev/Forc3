'use client'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const STATUS_CONFIG = {
  undertrained: { color: 'text-blue-400', bg: 'bg-blue-950/30 border-blue-900/50', bgColor: 'bg-blue-400', icon: '📉', label: 'Under Target' },
  optimal:      { color: 'text-green-400', bg: 'bg-green-950/30 border-green-900/50', bgColor: 'bg-green-400', icon: '✅', label: 'Optimal Zone' },
  caution:      { color: 'text-yellow-400', bg: 'bg-yellow-950/30 border-yellow-900/50', bgColor: 'bg-yellow-400', icon: '⚠️', label: 'Caution' },
  danger:       { color: 'text-red-400', bg: 'bg-red-950/30 border-red-900/50', bgColor: 'bg-red-400', icon: '🚨', label: 'High Risk' },
}

export function TrainingLoadCard() {
  const { data, isLoading } = useSWR('/api/training/load', fetcher, { revalidateOnFocus: false })

  if (isLoading) return <div className="mx-5 h-24 bg-gray-900 rounded-3xl animate-pulse" />
  if (!data || data.error) return null

  const config = STATUS_CONFIG[data.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.optimal

  return (
    <div className={`mx-5 rounded-3xl border p-5 ${config.bg}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Training Load (ACWR)</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            <span className={`font-black text-xl ${config.color}`}>{config.label}</span>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-black text-3xl ${config.color}`}>{data.acwr}</p>
          <p className="text-gray-500 text-xs">ratio</p>
        </div>
      </div>

      {/* ACWR gauge */}
      <div className="relative h-2 bg-gray-800 rounded-full mb-3 overflow-visible">
        <div className="absolute inset-0 flex rounded-full overflow-hidden">
          <div className="flex-1 bg-blue-900/50" />
          <div className="flex-[2] bg-green-900/50" />
          <div className="flex-[0.5] bg-yellow-900/50" />
          <div className="flex-[0.5] bg-red-900/50" />
        </div>
        <div
          className={`absolute top-1/2 w-3 h-3 rounded-full border-2 border-black ${config.bgColor}`}
          style={{ left: `${Math.min(95, Math.max(2, (data.acwr / 2) * 100))}%`, transform: 'translateX(-50%) translateY(-50%)' }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600 mb-3">
        <span>0.8</span><span>1.3</span><span>1.5</span><span>2.0+</span>
      </div>

      <p className="text-gray-300 text-xs leading-relaxed">{data.recommendation}</p>
    </div>
  )
}
