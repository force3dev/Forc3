export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-black text-white pb-28 animate-pulse">
      <div className="h-32 bg-[#141414]" />
      <div className="px-5 -mt-10">
        <div className="w-20 h-20 bg-[#1a1a1a] rounded-full border-4 border-black mb-3" />
        <div className="h-6 w-40 bg-[#1a1a1a] rounded mb-1" />
        <div className="h-4 w-24 bg-[#1a1a1a] rounded mb-4" />
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="h-16 bg-[#141414] border border-[#262626] rounded-2xl" />
          <div className="h-16 bg-[#141414] border border-[#262626] rounded-2xl" />
          <div className="h-16 bg-[#141414] border border-[#262626] rounded-2xl" />
          <div className="h-16 bg-[#141414] border border-[#262626] rounded-2xl" />
        </div>
        <div className="h-10 bg-[#141414] border border-[#262626] rounded-2xl mb-4" />
        <div className="flex gap-4 mb-4">
          <div className="h-8 w-20 bg-[#1a1a1a] rounded" />
          <div className="h-8 w-20 bg-[#1a1a1a] rounded" />
          <div className="h-8 w-20 bg-[#1a1a1a] rounded" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-[#141414] border border-[#262626] rounded-2xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
