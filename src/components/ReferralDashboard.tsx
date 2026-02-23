"use client"
import { useEffect, useState } from "react"

interface ReferralStats {
  code: string
  totalReferrals: number
  converted: number
  credits: number
}

export default function ReferralDashboard() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch("/api/referral")
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  const referralUrl = stats ? `https://forc3.app/join?ref=${stats.code}` : ""

  function copyLink() {
    if (!referralUrl) return
    navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(`Join me on FORC3 — the best hybrid athlete training app! You get a 14-day free trial: ${referralUrl}`)
    window.open(`https://wa.me/?text=${text}`, "_blank")
  }

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🎁</span>
        <div>
          <h3 className="font-bold">Refer Friends, Train Free</h3>
          <p className="text-neutral-500 text-xs">Get 1 month free for every friend who subscribes</p>
        </div>
      </div>

      {stats ? (
        <>
          {/* Referral link */}
          <div className="space-y-2">
            <div className="text-xs text-neutral-500">Your referral link</div>
            <div className="flex gap-2">
              <div className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-xl px-3 py-2 text-sm text-neutral-300 truncate">
                {referralUrl}
              </div>
              <button
                onClick={copyLink}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  copied ? "bg-[#00C853] text-black" : "bg-[#0066FF] text-white"
                }`}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest">How it works</div>
            {[
              "Share your link with friends",
              "They get a 14-day free trial",
              "When they subscribe, you get 1 month FREE",
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-neutral-300">
                <span className="text-[#0066FF] font-bold">{i + 1}.</span>
                {s}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalReferrals}</div>
              <div className="text-xs text-neutral-500">Invited</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#00C853]">{stats.converted}</div>
              <div className="text-xs text-neutral-500">Premium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#FFD700]">{stats.credits}</div>
              <div className="text-xs text-neutral-500">Mo. Free</div>
            </div>
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={shareWhatsApp}
              className="py-3 bg-[#25D366] text-black font-bold rounded-xl text-sm"
            >
              Share on WhatsApp
            </button>
            <button
              onClick={copyLink}
              className="py-3 bg-[#262626] text-white font-bold rounded-xl text-sm"
            >
              Copy Link
            </button>
          </div>
        </>
      ) : (
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-[#262626] rounded-xl" />
          <div className="h-24 bg-[#262626] rounded-xl" />
        </div>
      )}
    </div>
  )
}
