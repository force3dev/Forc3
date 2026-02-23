import React from 'react'

function Shimmer({ className }: { className: string }) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{
        background: 'linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  )
}

export function WorkoutCardSkeleton() {
  return (
    <>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#262626] flex items-center justify-between">
          <div className="space-y-2">
            <Shimmer className="h-3 w-16" />
            <Shimmer className="h-5 w-32" />
            <Shimmer className="h-3 w-20" />
          </div>
          <div className="flex gap-2">
            <Shimmer className="h-9 w-16" />
            <Shimmer className="h-9 w-20" />
          </div>
        </div>
        <div className="px-5 py-4 space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center justify-between">
              <Shimmer className="h-4 w-36" />
              <Shimmer className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-black text-white pb-24">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <header className="px-6 pt-8 pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Shimmer className="h-3 w-12" />
            <Shimmer className="h-7 w-40" />
            <Shimmer className="h-3 w-24" />
          </div>
          <div className="space-y-1 text-right">
            <Shimmer className="h-3 w-16 ml-auto" />
            <Shimmer className="h-3 w-20 ml-auto" />
          </div>
        </div>
      </header>
      <div className="px-6 space-y-5">
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3].map(i => (
            <Shimmer key={i} className="h-8 w-24 flex-shrink-0 rounded-full" />
          ))}
        </div>
        <Shimmer className="h-24 w-full" />
        <WorkoutCardSkeleton />
        <Shimmer className="h-28 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Shimmer className="h-24 w-full" />
          <Shimmer className="h-24 w-full" />
        </div>
      </div>
    </main>
  )
}
