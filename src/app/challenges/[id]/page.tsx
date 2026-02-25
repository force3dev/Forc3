'use client'
import useSWR from 'swr'
import { useRouter, useParams } from 'next/navigation'
import { format } from 'date-fns'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ChallengeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { data, isLoading } = useSWR(`/api/challenges/${params.id}`, fetcher)

  if (isLoading) return (
    <div className="min-h-dvh bg-black text-white flex items-center justify-center">
      <div className="animate-pulse text-gray-500">Loading challenge...</div>
    </div>
  )

  if (!data?.challenge) return (
    <div className="min-h-dvh bg-black text-white flex items-center justify-center px-5">
      <div className="text-center">
        <p className="text-5xl mb-4">🏆</p>
        <h2 className="text-xl font-black mb-2">Challenge Not Found</h2>
        <button onClick={() => router.back()} className="text-gray-500 text-sm mt-4">← Back</button>
      </div>
    </div>
  )

  const { challenge, participants } = data
  const daysLeft = Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  const isActive = challenge.isActive && daysLeft > 0

  const unitLabel = challenge.type === 'volume' ? 'lbs' : challenge.type === 'workouts' ? 'workouts' : challenge.type === 'cardio' ? 'km' : 'days'

  return (
    <div className="min-h-dvh bg-black text-white pb-32">
      <div className="px-5 pt-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400 p-2 -ml-2">←</button>
          <div className="flex-1">
            <h1 className="text-xl font-black">{challenge.title}</h1>
            <p className="text-gray-500 text-xs">{challenge.description}</p>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`px-4 py-2 rounded-2xl text-sm font-bold ${isActive ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-gray-800 text-gray-400'}`}>
            {isActive ? `${daysLeft} days left` : 'Completed'}
          </div>
          <div className="bg-gray-900 rounded-2xl px-4 py-2 text-sm">
            <span className="text-gray-500">Target:</span> <span className="font-bold">{challenge.target} {unitLabel}</span>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-gray-900 rounded-3xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
            <p className="font-bold text-sm">Leaderboard</p>
          </div>
          {(participants || []).map((p: any, i: number) => {
            const pct = challenge.target > 0 ? Math.min(100, (p.progress / challenge.target) * 100) : 0
            return (
              <div key={p.userId} className={`px-5 py-4 border-b border-gray-800/50 last:border-0 ${p.isMe ? 'bg-green-950/20' : ''}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-gray-400 font-black w-6 text-sm text-right">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                  </span>
                  <span className={`font-bold text-sm flex-1 ${p.isMe ? 'text-green-400' : 'text-white'}`}>
                    {p.isMe ? 'You' : p.name}
                  </span>
                  <span className="font-black text-sm">{Math.round(p.progress)} {unitLabel}</span>
                </div>
                <div className="ml-9 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${p.completed ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Timeline */}
        <div className="mt-6 text-center text-gray-600 text-xs">
          {format(new Date(challenge.startDate), 'MMM d')} — {format(new Date(challenge.endDate), 'MMM d, yyyy')}
        </div>
      </div>
    </div>
  )
}
