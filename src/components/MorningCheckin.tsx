"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface CheckinData {
  message: string;
  cached: boolean;
}

interface Props {
  isPremium: boolean;
  messageUsed: boolean; // free user already used their daily message
}

export default function MorningCheckin({ isPremium, messageUsed }: Props) {
  const router = useRouter();
  const [data, setData] = useState<CheckinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/api/coach/morning-checkin")
      .then(r => r.json())
      .then(d => {
        setData(d);
        setTimeout(() => setVisible(true), 50);
      })
      .catch(() => setLoading(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#0066FF]/20 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-[#1e1e1e] rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-[#1e1e1e] rounded w-1/2 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div
      className={`bg-[#141414] border border-[#0066FF]/30 rounded-2xl p-5 space-y-3 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#0066FF] flex items-center justify-center font-bold text-sm flex-shrink-0">
          AI
        </div>
        <div>
          <div className="text-xs font-bold tracking-widest text-[#0066FF]">COACH</div>
          <div className="text-xs text-neutral-500">Morning Brief</div>
        </div>
      </div>

      {/* Message */}
      <p className="text-sm text-neutral-200 leading-relaxed">{data.message}</p>

      {/* Footer CTA */}
      {isPremium ? (
        <button
          onClick={() => router.push("/coach")}
          className="text-xs text-[#0066FF] hover:text-[#4d94ff] transition-colors flex items-center gap-1"
        >
          Ask your coach anything →
        </button>
      ) : messageUsed ? (
        <div className="space-y-2">
          <p className="text-xs text-neutral-600">1 of 1 daily coach messages used</p>
          <div className="relative bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl p-3 overflow-hidden">
            <p className="text-xs text-neutral-400 blur-sm select-none">
              Based on your training load, I&apos;d push the tempo run to 7 miles today and drop RPE to 6/10 on your lifts...
            </p>
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={() => router.push("/upgrade")}
                className="text-xs bg-[#0066FF] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-[#0052CC] transition-colors"
              >
                Upgrade for unlimited coaching
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-neutral-600">1 of 1 daily coach messages</p>
      )}
    </div>
  );
}
