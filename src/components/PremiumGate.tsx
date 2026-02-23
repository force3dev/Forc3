"use client";
import { useRouter } from "next/navigation";

interface PremiumGateProps {
  feature: string
  description?: string
  teaserText?: string
  onClose?: () => void
}

export default function PremiumGate({
  feature,
  description,
  teaserText,
  onClose,
}: PremiumGateProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#111111] border border-[#262626] rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl">
        {/* Icon + title */}
        <div className="text-center space-y-2">
          <div className="text-4xl">🔒</div>
          <h2 className="text-xl font-bold">{feature}</h2>
          {description && (
            <p className="text-sm text-neutral-400">{description}</p>
          )}
        </div>

        {/* Teaser blurred message */}
        {teaserText && (
          <div className="relative bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 overflow-hidden">
            <p className="text-sm text-neutral-300 blur-sm select-none leading-relaxed">
              {teaserText}
            </p>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-neutral-400 bg-[#1a1a1a]/90 px-3 py-1 rounded-full border border-[#333]">
                Preview locked
              </span>
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-neutral-400">Monthly</span>
            <span className="font-bold text-white">$14.99<span className="text-neutral-500 font-normal">/mo</span></span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-neutral-400">Yearly</span>
            <div className="text-right">
              <span className="font-bold text-[#00C853]">$99/yr</span>
              <span className="text-xs text-neutral-500 ml-1">Save 45%</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/upgrade")}
            className="w-full py-4 bg-[#0066FF] text-white font-bold rounded-xl hover:bg-[#0052CC] transition-colors"
          >
            Upgrade to Premium
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 text-neutral-500 text-sm hover:text-neutral-300 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
