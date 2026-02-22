"use client";
import { useState } from "react";

export interface CardioType {
  id: string;
  icon: string;
  name: string;
  hasGPS: boolean;
  hasIntervals?: boolean;
  hasSportPicker?: boolean;
}

const CARDIO_TYPES: CardioType[] = [
  { id: "running", icon: "🏃", name: "Running", hasGPS: true },
  { id: "cycling", icon: "🚴", name: "Cycling", hasGPS: true },
  { id: "swimming", icon: "🏊", name: "Swimming", hasGPS: false },
  { id: "hiit", icon: "⚡", name: "HIIT", hasGPS: false, hasIntervals: true },
  { id: "rowing", icon: "🚣", name: "Rowing", hasGPS: false },
  { id: "jump_rope", icon: "🪢", name: "Jump Rope", hasGPS: false },
  { id: "elliptical", icon: "🔄", name: "Elliptical", hasGPS: false },
  { id: "walking", icon: "🚶", name: "Walking", hasGPS: true },
  { id: "stair_climber", icon: "🪜", name: "Stair Climber", hasGPS: false },
  { id: "sports", icon: "⚽", name: "Sports", hasGPS: false, hasSportPicker: true },
];

const SPORTS = [
  "Basketball", "Soccer", "Tennis", "Football", "Baseball",
  "Volleyball", "Hockey", "Golf", "Boxing", "MMA", "Wrestling",
];

interface Props {
  onSelect: (type: CardioType, sport?: string) => void;
}

export function CardioActivityPicker({ onSelect }: Props) {
  const [showSports, setShowSports] = useState(false);

  if (showSports) {
    const sportsType = CARDIO_TYPES.find(t => t.id === "sports")!;
    return (
      <div className="p-4">
        <button
          onClick={() => setShowSports(false)}
          className="text-neutral-400 text-sm mb-4"
        >
          ← Back
        </button>
        <h3 className="font-bold mb-4">Select Sport</h3>
        <div className="grid grid-cols-2 gap-3">
          {SPORTS.map(sport => (
            <button
              key={sport}
              onClick={() => onSelect(sportsType, sport)}
              className="bg-[#141414] border border-[#262626] rounded-xl p-4 text-left font-semibold text-sm hover:border-[#0066FF]/50 transition-colors"
            >
              {sport}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="font-bold text-lg mb-4">Choose Activity</h2>
      <div className="grid grid-cols-2 gap-3">
        {CARDIO_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => type.hasSportPicker ? setShowSports(true) : onSelect(type)}
            className="bg-[#141414] border border-[#262626] rounded-2xl p-4 text-center hover:border-[#0066FF]/50 transition-colors"
          >
            <div className="text-3xl mb-2">{type.icon}</div>
            <div className="font-semibold text-sm">{type.name}</div>
            {type.hasGPS && <div className="text-[10px] text-neutral-600 mt-0.5">GPS</div>}
          </button>
        ))}
      </div>
    </div>
  );
}
