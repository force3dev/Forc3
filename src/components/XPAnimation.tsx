"use client";
import { useEffect, useState } from "react";

interface XPToast {
  id: number;
  amount: number;
  levelUp?: { level: number; name: string };
}

const LEVEL_NAMES: Record<number, string> = {
  1: "Beginner", 2: "Athlete", 3: "Warrior",
  4: "Elite", 5: "Legend", 6: "Champion",
};

let toastId = 0;
const listeners: Array<(toast: XPToast) => void> = [];

export function showXPGain(amount: number, levelUp?: { level: number }) {
  const toast: XPToast = {
    id: ++toastId,
    amount,
    levelUp: levelUp ? { level: levelUp.level, name: LEVEL_NAMES[levelUp.level] || `Level ${levelUp.level}` } : undefined,
  };
  listeners.forEach(fn => fn(toast));
}

export function XPAnimation() {
  const [toasts, setToasts] = useState<XPToast[]>([]);

  useEffect(() => {
    function onToast(toast: XPToast) {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 2500);
    }
    listeners.push(onToast);
    return () => {
      const idx = listeners.indexOf(onToast);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-32 right-5 z-50 space-y-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="animate-[slideUpFade_2.5s_ease-out_forwards]"
          style={{
            animation: "xpFloat 2.5s ease-out forwards",
          }}
        >
          {toast.levelUp ? (
            <div className="bg-gradient-to-r from-[#FFB300] to-[#FF6600] text-black font-black px-4 py-3 rounded-2xl shadow-lg">
              <div className="text-sm">LEVEL UP! 🎉</div>
              <div className="text-xs">Level {toast.levelUp.level} — {toast.levelUp.name}</div>
            </div>
          ) : (
            <div className="bg-[#FFB300] text-black font-black px-4 py-2 rounded-xl shadow-lg">
              +{toast.amount} XP ⭐
            </div>
          )}
        </div>
      ))}
      <style>{`
        @keyframes xpFloat {
          0% { opacity: 0; transform: translateY(0px); }
          20% { opacity: 1; transform: translateY(-10px); }
          80% { opacity: 1; transform: translateY(-30px); }
          100% { opacity: 0; transform: translateY(-50px); }
        }
      `}</style>
    </div>
  );
}
