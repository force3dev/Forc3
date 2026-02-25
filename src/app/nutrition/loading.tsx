export default function NutritionLoading() {
  return (
    <main className="min-h-screen bg-black text-white pb-28 animate-pulse">
      <header className="px-5 pt-8 pb-4">
        <div className="h-6 w-36 bg-[#1a1a1a] rounded mb-2" />
        <div className="h-4 w-28 bg-[#1a1a1a] rounded" />
      </header>
      <div className="px-5 space-y-4">
        <div className="flex justify-center py-6">
          <div className="w-40 h-40 bg-[#141414] border border-[#262626] rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 bg-[#141414] border border-[#262626] rounded-2xl" />
          <div className="h-16 bg-[#141414] border border-[#262626] rounded-2xl" />
          <div className="h-16 bg-[#141414] border border-[#262626] rounded-2xl" />
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-[#141414] border border-[#262626] rounded-2xl" />
        ))}
      </div>
    </main>
  );
}
