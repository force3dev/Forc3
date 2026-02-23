
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/shared/BottomNav";
import { getRacePhase, getRacePhaseName, calculateTaper } from "@/lib/taper-calculator";

interface RaceWeekData {
  plan: string;
  raceDate: string;
  raceType: string;
  daysUntilRace: number;
}

const PHASES = ["base", "build", "peak", "taper", "race_week", "race_day"];

const CHECKLIST: Record<string, string[]> = {
  marathon: ["Book travel & accommodation", "Pick up race packet", "Plan nutrition strategy", "Prepare race kit", "Set race morning alarm", "Pack gels/nutrition", "Charge GPS watch"],
  half_marathon: ["Book travel", "Race packet pickup", "Plan nutrition", "Prepare kit", "Sleep strategy"],
  "5k": ["Warm-up routine", "Pace strategy", "Race kit ready"],
  ironman: ["Transition bags packed", "Wetsuit ready", "Bike tuned", "Nutrition per leg planned", "Pacing zones set"],
  spartan: ["Grip gloves ready", "Trail shoes prepped", "Obstacle practice", "Pack energy gels"],
};

export default function RacePlannerPage() {
  const router = useRouter();
  const [data, setData] = useState<RaceWeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/race-planner/race-week")
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError("Failed to load race plan"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full" />
    </main>
  );

  if (error || !data) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <div className="text-4xl">🏁</div>
        <h2 className="text-xl font-bold">No Race Goal Set</h2>
        <p className="text-neutral-400 text-sm">Add a race goal in your profile to unlock the race planner.</p>
        <button onClick={() => router.push("/settings/profile")} className="px-6 py-3 bg-[#0066FF] rounded-xl font-bold text-sm">
          Set Race Goal →
        </button>
      </div>
    </main>
  );

  const raceDate = new Date(data.raceDate);
  const phase = getRacePhase(raceDate, data.raceType);
  const taper = calculateTaper(raceDate, data.raceType);
  const checklist = CHECKLIST[data.raceType] || CHECKLIST.marathon;
  const currentPhaseIdx = PHASES.indexOf(phase);

  // Countdown
  const days = data.daysUntilRace;
  const hours = Math.floor((raceDate.getTime() - Date.now()) / 3600000) % 24;

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      <header className="px-6 pt-8 pb-4">
        <div className="text-xs font-bold tracking-widest text-[#0066FF]">RACE PLANNER</div>
        <h1 className="text-2xl font-bold mt-1 capitalize">{data.raceType.replace('_', ' ')}</h1>
        <p className="text-neutral-400 text-sm">{raceDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </header>

      <div className="px-6 space-y-5">
        {/* Countdown */}
        <div className="bg-gradient-to-br from-[#0066FF]/20 to-[#00C853]/10 border border-[#0066FF]/40 rounded-2xl p-6 text-center">
          <div className="text-5xl font-black">{days}<span className="text-2xl font-bold text-neutral-400">d</span> {hours}<span className="text-2xl font-bold text-neutral-400">h</span></div>
          <div className="text-neutral-400 text-sm mt-1">until race day</div>
        </div>

        {/* Phase progress */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 space-y-3">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Training Phase</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {PHASES.map((p, i) => (
              <div key={p} className={`flex-shrink-0 px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${i === currentPhaseIdx ? 'bg-[#0066FF] text-white' : i < currentPhaseIdx ? 'bg-[#00C853]/20 text-[#00C853]' : 'bg-[#1a1a1a] text-neutral-600'}`}>
                {getRacePhaseName(p)}
              </div>
            ))}
          </div>
          <div className="text-sm font-semibold">Current: <span className="text-[#0066FF]">{getRacePhaseName(phase)}</span></div>
          {phase === 'taper' && <p className="text-xs text-neutral-400">Taper starts {taper.taperStart.toLocaleDateString()} · Reduce volume to {Math.round((taper.volumeReduction[0] || 0.7) * 100)}% this week</p>}
        </div>

        {/* AI Race Week Plan */}
        {data.plan && (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-2">
            <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest">This Week&apos;s Focus</div>
            <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{data.plan}</p>
          </div>
        )}

        {/* Race Day Checklist */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-3">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Race Day Checklist</div>
          {checklist.map(item => (
            <ChecklistItem key={item} label={item} />
          ))}
        </div>
      </div>

      <BottomNav active="home" />
    </main>
  );
}

function ChecklistItem({ label }: { label: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <button onClick={() => setChecked(!checked)} className="flex items-center gap-3 w-full text-left">
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${checked ? 'bg-[#00C853] border-[#00C853]' : 'border-[#333]'}`}>
        {checked && <span className="text-black text-xs">✓</span>}
      </div>
      <span className={`text-sm ${checked ? 'line-through text-neutral-600' : 'text-neutral-200'}`}>{label}</span>
    </button>
  );
}
