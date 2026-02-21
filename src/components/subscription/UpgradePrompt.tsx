"use client";
import { useRouter } from "next/navigation";

interface UpgradePromptProps {
  feature: string;
  description?: string;
  compact?: boolean;
}

export default function UpgradePrompt({ feature, description, compact }: UpgradePromptProps) {
  const router = useRouter();

  if (compact) {
    return (
      <button
        onClick={() => router.push("/settings/upgrade")}
        className="flex items-center gap-1.5 text-xs text-[#FFB300] border border-[#FFB300]/30 bg-[#FFB300]/10 rounded-lg px-2.5 py-1.5 hover:bg-[#FFB300]/20 transition-colors"
      >
        🔒 Upgrade for {feature}
      </button>
    );
  }

  return (
    <div className="bg-[#141414] border border-[#FFB300]/30 rounded-2xl p-6 text-center space-y-3">
      <div className="text-3xl">🔒</div>
      <h3 className="font-bold text-[#FFB300]">{feature}</h3>
      {description && <p className="text-sm text-neutral-400">{description}</p>}
      <button
        onClick={() => router.push("/settings/upgrade")}
        className="w-full py-3 bg-[#FFB300] text-black font-bold rounded-xl hover:bg-[#E5A000] transition-colors"
      >
        Upgrade to Pro — $9.99/mo
      </button>
      <p className="text-xs text-neutral-600">7-day free trial, cancel anytime</p>
    </div>
  );
}
