export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-black text-white pb-28 animate-pulse">
      <header className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 w-24 bg-[#1a1a1a] rounded mb-2" />
            <div className="h-6 w-40 bg-[#1a1a1a] rounded" />
          </div>
          <div className="w-10 h-10 bg-[#1a1a1a] rounded-full" />
        </div>
      </header>
      <div className="px-5 space-y-4">
        <div className="h-44 bg-[#141414] border border-[#262626] rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 bg-[#141414] border border-[#262626] rounded-2xl" />
          <div className="h-20 bg-[#141414] border border-[#262626] rounded-2xl" />
          <div className="h-20 bg-[#141414] border border-[#262626] rounded-2xl" />
        </div>
        <div className="h-32 bg-[#141414] border border-[#262626] rounded-2xl" />
        <div className="h-24 bg-[#141414] border border-[#262626] rounded-2xl" />
      </div>
    </main>
  );
}
