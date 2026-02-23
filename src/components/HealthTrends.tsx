"use client";
import { useEffect, useState } from "react";
import PremiumGate from "@/components/PremiumGate";

interface HealthEntry {
  date: string;
  sleepQuality: number;
  energyLevel: number;
  soreness: string;
}

interface Props {
  isPremium: boolean;
}

// Normalises a value 1-10 into an SVG Y coordinate within the chart area.
function toY(val: number, h: number): number {
  return h - ((val - 1) / 9) * h;
}

function LineChart({ data, accessor, color }: {
  data: HealthEntry[];
  accessor: (d: HealthEntry) => number;
  color: string;
}) {
  const W = 300;
  const H = 70;
  const PAD = 8;

  if (!data.length) {
    return (
      <div className="h-[86px] flex items-center justify-center text-xs text-neutral-600">
        No data yet
      </div>
    );
  }

  const step = data.length > 1 ? (W - PAD * 2) / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = PAD + i * step;
    const y = PAD + toY(accessor(d), H - PAD * 2);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      {/* Horizontal grid lines */}
      {[2, 5, 8].map((v) => (
        <line
          key={v}
          x1={PAD} x2={W - PAD}
          y1={PAD + toY(v, H - PAD * 2)}
          y2={PAD + toY(v, H - PAD * 2)}
          stroke="#262626"
          strokeWidth="1"
        />
      ))}
      {/* Gradient fill */}
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {data.length > 1 && (
        <polygon
          points={`${PAD},${H} ${points.join(" ")} ${PAD + (data.length - 1) * step},${H}`}
          fill={`url(#grad-${color.replace("#", "")})`}
        />
      )}
      {/* Line */}
      {data.length > 1 && (
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {/* Dots */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={PAD + i * step}
          cy={PAD + toY(accessor(d), H - PAD * 2)}
          r="3"
          fill={color}
          stroke="#141414"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

function DateLabels({ data }: { data: HealthEntry[] }) {
  return (
    <div className="flex justify-between mt-1">
      {data.map((d) => (
        <span key={d.date} className="text-[9px] text-neutral-600">
          {new Date(d.date).toLocaleDateString("en-US", { weekday: "short" })}
        </span>
      ))}
    </div>
  );
}

function AppleHealthModal({ onClose }: { onClose: () => void }) {
  function handleNotify() {
    alert("Got it! We'll notify you when the iOS app launches.");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#141414] border border-[#262626] rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="text-4xl"></div>
          <h2 className="text-xl font-bold">Apple Health Sync</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Full Apple Health sync is coming in our iOS app. For now, log your daily stats
            above and we&apos;ll coach you based on real data.
          </p>
        </div>
        <button
          onClick={handleNotify}
          className="w-full py-4 bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold rounded-xl transition-colors"
        >
          Notify me when iOS app launches
        </button>
        <button
          onClick={onClose}
          className="w-full py-3 text-neutral-500 text-sm hover:text-neutral-300 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function HealthTrends({ isPremium }: Props) {
  const [data, setData] = useState<HealthEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGate, setShowGate] = useState(false);
  const [showAppleModal, setShowAppleModal] = useState(false);

  useEffect(() => {
    if (!isPremium) { setLoading(false); return; }
    fetch("/api/health")
      .then((r) => r.json())
      .then((d: HealthEntry[]) => setData(d.slice(-7)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isPremium]);

  if (!isPremium) {
    return (
      <>
        {/* Blurred teaser */}
        <div
          className="relative bg-[#141414] border border-[#262626] rounded-2xl p-5 overflow-hidden cursor-pointer"
          onClick={() => setShowGate(true)}
        >
          <div className="blur-sm select-none pointer-events-none space-y-4">
            <div className="text-sm font-bold text-neutral-200">7-Day Sleep Quality</div>
            <div className="h-[70px] bg-[#1a1a1a] rounded-xl" />
            <div className="text-sm font-bold text-neutral-200">7-Day Energy Trend</div>
            <div className="h-[70px] bg-[#1a1a1a] rounded-xl" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="text-3xl">🔒</div>
            <p className="text-sm font-semibold text-white">Premium Feature</p>
            <button
              className="px-5 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold rounded-xl transition-colors"
              onClick={(e) => { e.stopPropagation(); setShowGate(true); }}
            >
              Upgrade to Unlock
            </button>
          </div>
        </div>

        {showGate && (
          <PremiumGate
            feature="Health Trends"
            description="See your 7-day sleep and energy charts to optimise your training."
            teaserText="Your sleep averaged 7.4/10 this week. Energy dipped mid-week — consider an active recovery day on Wednesday."
            onClose={() => setShowGate(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold tracking-widest text-[#0066FF]">HEALTH TRENDS</div>
            <div className="text-xs text-neutral-500">Last 7 days</div>
          </div>
          <button
            onClick={() => setShowAppleModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] border border-[#262626] hover:border-[#0066FF]/50 rounded-xl text-xs font-medium text-neutral-300 transition-colors"
          >
            <span></span> Connect Apple Health
          </button>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-3 bg-[#262626] rounded w-1/3" />
            <div className="h-[86px] bg-[#1a1a1a] rounded-xl" />
            <div className="h-3 bg-[#262626] rounded w-1/3" />
            <div className="h-[86px] bg-[#1a1a1a] rounded-xl" />
          </div>
        ) : (
          <>
            {/* Sleep */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-200">😴 Sleep Quality</span>
                {data.length > 0 && (
                  <span className="text-xs text-neutral-500">
                    avg{" "}
                    <span className="text-[#0066FF] font-bold">
                      {(data.reduce((s, d) => s + d.sleepQuality, 0) / data.length).toFixed(1)}
                    </span>
                    /10
                  </span>
                )}
              </div>
              <div className="bg-[#0d0d0d] border border-[#262626] rounded-xl px-3 pt-3 pb-1">
                <LineChart data={data} accessor={(d) => d.sleepQuality} color="#0066FF" />
                <DateLabels data={data} />
              </div>
            </div>

            {/* Energy */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-200">⚡ Energy Level</span>
                {data.length > 0 && (
                  <span className="text-xs text-neutral-500">
                    avg{" "}
                    <span className="text-[#00C853] font-bold">
                      {(data.reduce((s, d) => s + d.energyLevel, 0) / data.length).toFixed(1)}
                    </span>
                    /10
                  </span>
                )}
              </div>
              <div className="bg-[#0d0d0d] border border-[#262626] rounded-xl px-3 pt-3 pb-1">
                <LineChart data={data} accessor={(d) => d.energyLevel} color="#00C853" />
                <DateLabels data={data} />
              </div>
            </div>
          </>
        )}
      </div>

      {showAppleModal && <AppleHealthModal onClose={() => setShowAppleModal(false)} />}
    </>
  );
}
