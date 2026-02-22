"use client";
import { useRouter } from "next/navigation";
import { CardioActivityPicker, CardioType } from "@/components/cardio/CardioActivityPicker";

export default function CardioActivitiesPage() {
  const router = useRouter();

  const handleSelect = (type: CardioType, sport?: string) => {
    const path = sport
      ? `/workout/cardio/${type.id}?sport=${encodeURIComponent(sport)}`
      : `/workout/cardio/${type.id}`;
    router.push(path);
  };

  return (
    <main className="min-h-screen bg-black text-white pb-6">
      <header className="px-5 pt-8 pb-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold">Cardio</h1>
      </header>

      <CardioActivityPicker onSelect={handleSelect} />
    </main>
  );
}
