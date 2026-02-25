export default function WorkoutLoading() {
  return (
    <main className="min-h-screen bg-black text-white pb-28 animate-pulse">
      <header className="px-5 pt-8 pb-4">
        <div className="h-6 w-48 bg-[#1a1a1a] rounded mb-2" />
        <div className="h-4 w-32 bg-[#1a1a1a] rounded" />
      </header>
      <div className="px-5 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-[#141414] border border-[#262626] rounded-2xl" />
        ))}
      </div>
    </main>
  );
}
