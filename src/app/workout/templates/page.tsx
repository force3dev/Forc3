'use client'
import useSWR from 'swr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/shared/BottomNav'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function TemplatesPage() {
  const { data, mutate } = useSWR('/api/workouts/custom', fetcher)
  const router = useRouter()
  const templates = data?.templates || data?.workouts || []

  async function deleteTemplate(id: string) {
    await fetch(`/api/workouts/custom/${id}`, { method: 'DELETE' })
    mutate()
  }

  return (
    <div className="min-h-dvh bg-black text-white pb-28">
      <div className="px-5 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => router.back()} className="text-neutral-400 text-sm mb-1 block">← Back</button>
            <h1 className="text-2xl font-black">My Templates</h1>
          </div>
          <Link href="/workout/create" className="bg-[#0066FF] text-white font-bold text-sm px-4 py-2.5 rounded-2xl">
            + New
          </Link>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-xl font-bold mb-2">No templates yet</p>
            <p className="text-neutral-400 mb-6">Build a custom workout and save it as a template</p>
            <Link href="/workout/create" className="bg-[#0066FF] text-white font-bold px-8 py-4 rounded-2xl inline-block">
              Build First Workout →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((t: any) => (
              <div key={t.id} className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-black text-lg">{t.name}</p>
                    <p className="text-neutral-500 text-sm">{Array.isArray(t.exercises) ? t.exercises.length : '?'} exercises</p>
                  </div>
                  <button onClick={() => deleteTemplate(t.id)} className="text-neutral-700 active:text-red-400 p-1">✕</button>
                </div>
                <Link
                  href={`/workout/active/${t.id}`}
                  className="block w-full bg-[#0066FF] text-white font-bold text-center py-3 rounded-xl active:scale-95 transition-transform"
                >
                  Start Workout →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav active="workout" />
    </div>
  )
}
