'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface LiveUpdate {
  userId: string
  userName: string
  exercise: string
  weight: number
  reps: number
  timestamp: string
}

export default function LiveWorkoutPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'menu' | 'host' | 'join'>('menu')
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [updates, setUpdates] = useState<LiveUpdate[]>([])
  const [connected, setConnected] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined)

  async function createRoom() {
    const res = await fetch('/api/workout/live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create' }),
    })
    const data = await res.json()
    if (data.roomCode) {
      setRoomCode(data.roomCode)
      setSessionId(data.sessionId)
      setMode('host')
      setConnected(true)
      startPolling(data.sessionId)
    }
  }

  async function joinRoom() {
    if (!joinCode.trim()) return
    const res = await fetch('/api/workout/live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', roomCode: joinCode.trim().toUpperCase() }),
    })
    const data = await res.json()
    if (data.sessionId) {
      setRoomCode(joinCode.trim().toUpperCase())
      setSessionId(data.sessionId)
      setMode('host')
      setConnected(true)
      startPolling(data.sessionId)
    }
  }

  function startPolling(sid: string) {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/workout/live?sessionId=${sid}&since=${Date.now() - 10000}`)
        const data = await res.json()
        if (data.updates?.length) {
          setUpdates(prev => [...prev, ...data.updates])
        }
      } catch { /* ignore */ }
    }, 5000)
  }

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  if (mode === 'menu') {
    return (
      <div className="min-h-dvh bg-black text-white flex flex-col items-center justify-center px-5">
        <span className="text-6xl mb-6">🤝</span>
        <h1 className="text-3xl font-black mb-2">Train Together</h1>
        <p className="text-gray-400 text-center mb-10">See each other&apos;s sets in real-time. No excuses.</p>

        <button onClick={createRoom} className="w-full max-w-xs bg-green-500 text-black font-black py-5 rounded-3xl text-xl mb-4 active:scale-95 transition-transform">
          Create Room
        </button>

        <div className="w-full max-w-xs">
          <input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Enter room code"
            className="w-full bg-gray-900 rounded-2xl px-4 py-4 text-white text-center font-mono text-xl placeholder-gray-600 focus:outline-none mb-2 tracking-widest"
            maxLength={10}
          />
          <button onClick={joinRoom} disabled={!joinCode.trim()} className="w-full bg-gray-800 text-white font-bold py-4 rounded-2xl disabled:opacity-40">
            Join Room
          </button>
        </div>

        <button onClick={() => router.back()} className="mt-8 text-gray-600 text-sm">← Back</button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-black text-white pb-32">
      <div className="px-5 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Live Session</p>
            <h1 className="text-2xl font-black font-mono tracking-widest">{roomCode}</h1>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${connected ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
            {connected ? 'LIVE' : 'Connecting...'}
          </div>
        </div>

        <p className="text-gray-500 text-sm mb-6">Share this code with your training partner. Start your workout — sets will appear here in real-time.</p>

        {/* Live feed */}
        <div className="space-y-2">
          {updates.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              <span className="text-4xl block mb-3">💪</span>
              <p className="text-sm">Waiting for sets... Start your workout!</p>
            </div>
          )}
          {updates.map((u, i) => (
            <div key={i} className="bg-gray-900 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm">
                {u.userName?.[0] || '?'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">{u.userName}</p>
                <p className="text-gray-400 text-xs">{u.exercise} — {u.weight}lbs x {u.reps}</p>
              </div>
              <span className="text-2xl">🔥</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
