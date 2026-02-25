export default function CoachLoading() {
  return (
    <main className="min-h-screen bg-black text-white pb-28 animate-pulse">
      <header className="px-5 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1a1a1a] rounded-full" />
          <div>
            <div className="h-5 w-28 bg-[#1a1a1a] rounded mb-1" />
            <div className="h-3 w-20 bg-[#1a1a1a] rounded" />
          </div>
        </div>
      </header>
      <div className="px-5 space-y-4">
        <div className="flex gap-2">
          <div className="h-8 w-28 bg-[#141414] border border-[#262626] rounded-full" />
          <div className="h-8 w-24 bg-[#141414] border border-[#262626] rounded-full" />
          <div className="h-8 w-32 bg-[#141414] border border-[#262626] rounded-full" />
        </div>
        <div className="space-y-4 pt-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-[#1a1a1a] rounded-full flex-shrink-0" />
            <div className="h-20 w-3/4 bg-[#141414] border border-[#262626] rounded-2xl" />
          </div>
          <div className="flex justify-end">
            <div className="h-12 w-1/2 bg-[#0066FF]/10 border border-[#0066FF]/20 rounded-2xl" />
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-[#1a1a1a] rounded-full flex-shrink-0" />
            <div className="h-16 w-2/3 bg-[#141414] border border-[#262626] rounded-2xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
