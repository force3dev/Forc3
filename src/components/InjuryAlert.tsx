"use client"
import { useState } from "react"

interface InjuryFlag {
  id: string
  type: string
  severity: string
  muscle?: string
  message: string
  createdAt: string
}

interface InjuryAlertProps {
  flags: InjuryFlag[]
  onDismiss?: (id: string) => void
}

const SEVERITY_STYLES: Record<string, { bg: string; border: string; icon: string; label: string }> = {
  info: { bg: "bg-blue-950/50", border: "border-[#0066FF]/40", icon: "ℹ️", label: "Info" },
  warning: { bg: "bg-yellow-950/50", border: "border-yellow-500/40", icon: "⚠️", label: "Warning" },
  alert: { bg: "bg-red-950/50", border: "border-red-500/40", icon: "🚨", label: "Alert" },
}

export default function InjuryAlert({ flags, onDismiss }: InjuryAlertProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = flags.filter(f => !dismissed.has(f.id))
  if (visible.length === 0) return null

  function dismiss(id: string) {
    setDismissed(prev => new Set([...prev, id]))
    fetch(`/api/injury/acknowledge`, { method: "POST", body: JSON.stringify({ id }) }).catch(() => {})
    onDismiss?.(id)
  }

  return (
    <div className="space-y-2">
      {visible.map(flag => {
        const style = SEVERITY_STYLES[flag.severity] ?? SEVERITY_STYLES.info
        const isExpanded = expanded === flag.id
        return (
          <div key={flag.id} className={`${style.bg} border ${style.border} rounded-2xl p-4`}>
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{style.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white leading-relaxed">
                  {isExpanded ? flag.message : flag.message.slice(0, 80) + (flag.message.length > 80 ? "..." : "")}
                </p>
                {flag.message.length > 80 && (
                  <button
                    onClick={() => setExpanded(isExpanded ? null : flag.id)}
                    className="text-xs text-neutral-400 mt-1"
                  >
                    {isExpanded ? "Show less" : "See recommendations"}
                  </button>
                )}
              </div>
              <button
                onClick={() => dismiss(flag.id)}
                className="text-neutral-600 hover:text-neutral-300 text-lg flex-shrink-0"
              >
                ×
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
