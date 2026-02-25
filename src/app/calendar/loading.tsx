export default function CalendarLoading() {
  return (
    <main className="min-h-screen bg-black text-white pb-28 animate-pulse">
      <header className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-36 bg-[#1a1a1a] rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-16 bg-[#141414] border border-[#262626] rounded-lg" />
            <div className="h-8 w-16 bg-[#141414] border border-[#262626] rounded-lg" />
          </div>
        </div>
      </header>
      <div className="px-5 space-y-3">
        <div className="grid grid-cols-7 gap-1">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-4 bg-[#1a1a1a] rounded mx-1" />
          ))}
        </div>
        {[...Array(5)].map((_, row) => (
          <div key={row} className="grid grid-cols-7 gap-1">
            {[...Array(7)].map((_, col) => (
              <div key={col} className="h-14 bg-[#141414] border border-[#262626] rounded-lg" />
            ))}
          </div>
        ))}
        <div className="h-12 bg-[#141414] border border-[#262626] rounded-2xl" />
      </div>
    </main>
  );
}
