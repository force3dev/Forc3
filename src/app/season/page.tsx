'use client'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const RANK_THRESHOLDS: Record<string, number> = {
  Rookie: 0, Athlete: 1000, Competitor: 3000, Elite: 7000, Champion: 15000, Legend: 30000,
}
const RANK_COLORS: Record<string, string> = {
  Rookie: '#6b7280', Athlete: '#22c55e', Competitor: '#3b82f6', Elite: '#a855f7', Champion: '#f59e0b', Legend: '#ef4444',
}
const RANK_EMOJIS: Record<string, string> = {
  Rookie: '🌱', Athlete: '💪', Competitor: '🔥', Elite: '⚡', Champion: '👑', Legend: '🏆',
}

export default function SeasonPage() {
  const router = useRouter()
  const { data } = useSWR('/api/season/current', fetcher)
  const { data: leaderboard } = useSWR('/api/season/leaderboard', fetcher)

  if (!data?.season) return (
    <div className="min-h-dvh bg-black text-white flex items-center justify-center px-5">
      <div className="text-center">
        <p className="text-5xl mb-4">🏆</p>
        <h2 className="text-2xl font-black mb-2">No Active Season</h2>
        <p className="text-gray-400">New season starting soon. Keep training.</p>
        <button onClick={() => router.back()} className="mt-6 text-gray-600 text-sm">← Back</button>
      </div>
    </div>
  )

  const { season, xp, rank, rankColor, rankEmoji, nextRank, xpNeeded, progress, leaderboardPosition } = data

  const daysLeft = Math.ceil((new Date(season.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const totalDays = Math.ceil((new Date(season.endDate).getTime() - new Date(season.startDate).getTime()) / (1000 * 60 * 60 * 24))

  const RANKS = Object.keys(RANK_THRESHOLDS)

  return (
    <div className="min-h-dvh bg-black text-white pb-32">
      <div className="px-5 pt-8">

        {/* Season header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => router.back()} className="text-neutral-400 text-sm mb-1">← Back</button>
            <p className="text-gray-500 text-xs uppercase tracking-wider">{season.name}</p>
            <h1 className="text-2xl font-black">{daysLeft} days left</h1>
          </div>
          <div className="bg-gray-900 rounded-2xl px-4 py-2 text-right">
            <p className="text-gray-500 text-xs">Position</p>
            <p className="font-black text-xl">#{leaderboardPosition}</p>
          </div>
        </div>

        {/* Rank card */}
        <div
          className="rounded-3xl p-6 mb-6 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${rankColor}20, ${rankColor}05)`, borderColor: `${rankColor}30`, border: '1px solid' }}
        >
          <div className="flex items-center gap-4">
            <span className="text-6xl">{rankEmoji}</span>
            <div className="flex-1">
              <p className="text-gray-400 text-sm">Current Rank</p>
              <p className="font-black text-3xl" style={{ color: rankColor }}>{rank}</p>
              <p className="text-gray-400 text-sm">{xp.toLocaleString()} Season XP</p>
            </div>
          </div>

          {nextRank && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{rank}</span>
                <span>{RANK_EMOJIS[nextRank]} {nextRank} — {xpNeeded.toLocaleString()} XP away</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%`, backgroundColor: rankColor }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Rank ladder */}
        <div className="bg-gray-900 rounded-3xl p-5 mb-6">
          <p className="font-bold mb-4">Season Ranks</p>
          <div className="space-y-3">
            {RANKS.map((r) => {
              const threshold = RANK_THRESHOLDS[r]
              const color = RANK_COLORS[r]
              const emoji = RANK_EMOJIS[r]
              const isCurrent = r === rank
              const isAchieved = xp >= threshold

              return (
                <div key={r} className={`flex items-center gap-3 py-2 px-3 rounded-2xl ${isCurrent ? 'bg-gray-800 ring-1 ring-current' : ''}`}
                     style={isCurrent ? { color } : {}}>
                  <span className="text-2xl">{emoji}</span>
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${isAchieved ? 'text-white' : 'text-gray-600'}`}>{r}</p>
                    <p className="text-gray-600 text-xs">{threshold.toLocaleString()} XP</p>
                  </div>
                  {isAchieved && !isCurrent && <span className="text-green-400 text-xs">✓</span>}
                  {isCurrent && <span className="text-xs font-bold" style={{ color }}>YOU</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Season leaderboard */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-black text-lg">Leaderboard</p>
            <p className="text-gray-500 text-xs">Season rankings</p>
          </div>
          <div className="bg-gray-900 rounded-3xl overflow-hidden">
            {(leaderboard?.entries || []).slice(0, 10).map((entry: any, i: number) => (
              <div
                key={entry.userId}
                className={`flex items-center gap-3 px-5 py-4 border-b border-gray-800/50 last:border-0 ${entry.isMe ? 'bg-green-950/20' : ''}`}
              >
                <span className="text-gray-400 font-black w-6 text-sm text-right">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                </span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                     style={{ background: (RANK_COLORS[entry.rank] || '#6b7280') + '30', color: RANK_COLORS[entry.rank] || '#6b7280' }}>
                  {entry.rankEmoji}
                </div>
                <div className="flex-1">
                  <p className={`font-bold text-sm ${entry.isMe ? 'text-green-400' : 'text-white'}`}>
                    {entry.isMe ? 'You' : entry.name}
                  </p>
                  <p className="text-gray-500 text-xs">{entry.rank}</p>
                </div>
                <p className="font-black text-sm">{(entry.xp || 0).toLocaleString()}</p>
              </div>
            ))}
            {(!leaderboard?.entries || leaderboard.entries.length === 0) && (
              <div className="px-5 py-8 text-center text-gray-600 text-sm">No participants yet</div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
