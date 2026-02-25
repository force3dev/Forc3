"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StravaConnect from "@/components/StravaConnect";
import PushPermission from "@/components/PushPermission";
import ReferralDashboard from "@/components/ReferralDashboard";

const SECTIONS = [
  {
    title: "Account",
    items: [
      { label: "Edit Profile", href: "/settings/profile", icon: "👤" },
      { label: "Subscription & Billing", href: "/settings/upgrade", icon: "⭐" },
      { label: "Export Data", href: "/settings/export", icon: "📦" },
    ],
  },
  {
    title: "Training",
    items: [
      { label: "My Program", href: "/program", icon: "📋" },
      { label: "Exercise Library", href: "/exercises", icon: "🏋️" },
      { label: "Body Measurements", href: "/progress/measurements", icon: "📏" },
      { label: "Workout History", href: "/history", icon: "📋" },
      { label: "Analytics", href: "/progress/analytics", icon: "📊" },
    ],
  },
  {
    title: "Tools & More",
    items: [
      { label: "Training Journal", href: "/journal", icon: "📓" },
      { label: "Visualization", href: "/mental/visualize", icon: "🧠" },
      { label: "Challenges", href: "/challenges/create", icon: "🏆" },
      { label: "Season Rankings", href: "/season", icon: "🎖️" },
    ],
  },
  {
    title: "App",
    items: [
      { label: "About FORC3", href: "/about", icon: "ℹ️" },
    ],
  },
];

const NOTIF_PREFS_KEY = "forc3_notif_prefs";

interface NotifPrefs {
  morningCheckin: boolean;
  workoutReminder: boolean;
  restTimerComplete: boolean;
  streakAtRisk: boolean;
  newFollowers: boolean;
  reactions: boolean;
  comments: boolean;
  friendActivity: boolean;
  newPR: boolean;
  achievementUnlocked: boolean;
  weeklyRecap: boolean;
  monthlySummary: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  morningCheckin: true,
  workoutReminder: true,
  restTimerComplete: true,
  streakAtRisk: true,
  newFollowers: true,
  reactions: true,
  comments: true,
  friendActivity: false,
  newPR: true,
  achievementUnlocked: true,
  weeklyRecap: true,
  monthlySummary: false,
};

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${on ? "bg-[#0066FF]" : "bg-[#333]"}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function NotifRow({
  label,
  sublabel,
  value,
  onToggle,
  border = true,
}: {
  label: string;
  sublabel?: string;
  value: boolean;
  onToggle: () => void;
  border?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between px-5 py-4 ${border ? "border-b border-[#1a1a1a]" : ""}`}>
      <div>
        <div className="text-sm font-medium">{label}</div>
        {sublabel && <div className="text-xs text-neutral-500 mt-0.5">{sublabel}</div>}
      </div>
      <Toggle on={value} onToggle={onToggle} />
    </div>
  );
}

const COACH_PERSONALITIES = [
  { key: "motivator", label: "Motivator" },
  { key: "scientist", label: "Scientist" },
  { key: "friend", label: "Friend" },
  { key: "drill_sergeant", label: "Drill Sgt" },
];

const REST_TIMERS = [60, 90, 120, 180];

export default function SettingsPage() {
  const router = useRouter();
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [units, setUnits] = useState<"lbs" | "kg">("lbs");
  const [weekStart, setWeekStart] = useState<"monday" | "sunday">("monday");
  const [restTimer, setRestTimer] = useState(90);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [showWarmups, setShowWarmups] = useState(true);
  const [coachPersonality, setCoachPersonality] = useState("motivator");

  useEffect(() => {
    setVoiceEnabled(localStorage.getItem("voiceCoachEnabled") !== "false");
    const stored = localStorage.getItem(NOTIF_PREFS_KEY);
    if (stored) {
      try { setNotifPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) }); } catch { /* ignore */ }
    }
    setUnits((localStorage.getItem("forc3_units") as "lbs" | "kg") || "lbs");
    setWeekStart((localStorage.getItem("forc3_week_start") as "monday" | "sunday") || "monday");
    setRestTimer(parseInt(localStorage.getItem("forc3_rest_timer") || "90"));
    setAutoAdvance(localStorage.getItem("forc3_auto_advance") !== "false");
    setShowWarmups(localStorage.getItem("forc3_show_warmups") !== "false");
    setCoachPersonality(localStorage.getItem("forc3_coach_personality") || "motivator");
  }, []);

  function toggleVoice() {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    localStorage.setItem("voiceCoachEnabled", String(next));
  }

  function togglePref(key: keyof NotifPrefs) {
    setNotifPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-black text-white pb-10">
      <header className="px-6 pt-8 pb-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a1a] text-neutral-400 hover:text-white"
        >
          ←
        </button>
        <h1 className="text-xl font-bold">Settings</h1>
      </header>

      <div className="px-6 space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <div className="text-xs text-neutral-500 uppercase tracking-widest mb-2 px-1">
              {section.title}
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
              {section.items.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-5 py-4 hover:bg-[#1a1a1a] transition-colors ${
                    i < section.items.length - 1 ? "border-b border-[#1a1a1a]" : ""
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  <span className="text-neutral-500 text-sm">→</span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Training Preferences */}
        <div>
          <div className="text-xs text-neutral-500 uppercase tracking-widest mb-2 px-1">Training</div>
          <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
            {/* Units */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
              <div className="text-sm font-medium">Weight Units</div>
              <div className="flex gap-1">
                {(["lbs", "kg"] as const).map(u => (
                  <button key={u} onClick={() => { setUnits(u); localStorage.setItem("forc3_units", u); }}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${units === u ? "bg-[#0066FF] text-white" : "bg-[#262626] text-neutral-400"}`}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
            {/* Week starts */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
              <div className="text-sm font-medium">Week Starts</div>
              <div className="flex gap-1">
                {(["monday", "sunday"] as const).map(d => (
                  <button key={d} onClick={() => { setWeekStart(d); localStorage.setItem("forc3_week_start", d); }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${weekStart === d ? "bg-[#0066FF] text-white" : "bg-[#262626] text-neutral-400"}`}>
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
            {/* Default rest timer */}
            <div className="px-5 py-4 border-b border-[#1a1a1a]">
              <div className="text-sm font-medium mb-3">Default Rest Timer</div>
              <div className="flex gap-2">
                {REST_TIMERS.map(t => (
                  <button key={t} onClick={() => { setRestTimer(t); localStorage.setItem("forc3_rest_timer", String(t)); }}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${restTimer === t ? "bg-[#0066FF] text-white" : "bg-[#262626] text-neutral-400"}`}>
                    {t}s
                  </button>
                ))}
              </div>
            </div>
            {/* Auto-advance */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
              <div>
                <div className="text-sm font-medium">Auto-advance after rest</div>
                <div className="text-xs text-neutral-500 mt-0.5">Jump to next exercise automatically</div>
              </div>
              <Toggle on={autoAdvance} onToggle={() => { const n = !autoAdvance; setAutoAdvance(n); localStorage.setItem("forc3_auto_advance", String(n)); }} />
            </div>
            {/* Show warmups */}
            <div className="flex items-center justify-between px-5 py-4">
              <div className="text-sm font-medium">Show warm-up sets</div>
              <Toggle on={showWarmups} onToggle={() => { const n = !showWarmups; setShowWarmups(n); localStorage.setItem("forc3_show_warmups", String(n)); }} />
            </div>
          </div>
        </div>

        {/* Coach Personality */}
        <div>
          <div className="text-xs text-neutral-500 uppercase tracking-widest mb-2 px-1">Coach Personality</div>
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
            <p className="text-xs text-neutral-500 mb-3">How Coach Alex communicates with you</p>
            <div className="grid grid-cols-2 gap-2">
              {COACH_PERSONALITIES.map(p => (
                <button key={p.key}
                  onClick={() => { setCoachPersonality(p.key); localStorage.setItem("forc3_coach_personality", p.key); }}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all ${coachPersonality === p.key ? "bg-[#0066FF] text-white" : "bg-[#262626] text-neutral-400 hover:text-white"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Voice Coach */}
        <div>
          <div className="text-xs text-neutral-500 uppercase tracking-widest mb-2 px-1">Coach</div>
          <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="text-lg">{voiceEnabled ? "🔊" : "🔇"}</span>
                <div>
                  <div className="text-sm font-medium">Voice Coach</div>
                  <div className="text-xs text-neutral-500">Audio cues during workouts</div>
                </div>
              </div>
              <Toggle on={voiceEnabled} onToggle={toggleVoice} />
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div>
          <div className="text-xs text-neutral-500 uppercase tracking-widest mb-2 px-1">Notifications</div>
          <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#1a1a1a]">
              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Training</div>
            </div>
            <NotifRow label="Morning check-in" sublabel="8:00 AM daily" value={notifPrefs.morningCheckin} onToggle={() => togglePref("morningCheckin")} />
            <NotifRow label="Workout reminder" sublabel="6:00 PM if not trained" value={notifPrefs.workoutReminder} onToggle={() => togglePref("workoutReminder")} />
            <NotifRow label="Rest timer complete" sublabel="During workout" value={notifPrefs.restTimerComplete} onToggle={() => togglePref("restTimerComplete")} />
            <NotifRow label="Streak at risk" sublabel="9:00 PM if no workout" value={notifPrefs.streakAtRisk} onToggle={() => togglePref("streakAtRisk")} border={false} />

            <div className="px-5 py-3 border-t border-b border-[#1a1a1a]">
              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Social</div>
            </div>
            <NotifRow label="New followers" value={notifPrefs.newFollowers} onToggle={() => togglePref("newFollowers")} />
            <NotifRow label="Reactions on my posts" value={notifPrefs.reactions} onToggle={() => togglePref("reactions")} />
            <NotifRow label="Comments on my posts" value={notifPrefs.comments} onToggle={() => togglePref("comments")} />
            <NotifRow label="Friend activity" sublabel="Off by default" value={notifPrefs.friendActivity} onToggle={() => togglePref("friendActivity")} border={false} />

            <div className="px-5 py-3 border-t border-b border-[#1a1a1a]">
              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Progress</div>
            </div>
            <NotifRow label="New PR achieved" value={notifPrefs.newPR} onToggle={() => togglePref("newPR")} />
            <NotifRow label="Achievement unlocked" value={notifPrefs.achievementUnlocked} onToggle={() => togglePref("achievementUnlocked")} />
            <NotifRow label="Weekly recap" sublabel="Sunday 7 PM" value={notifPrefs.weeklyRecap} onToggle={() => togglePref("weeklyRecap")} />
            <NotifRow label="Monthly summary" value={notifPrefs.monthlySummary} onToggle={() => togglePref("monthlySummary")} border={false} />
          </div>
        </div>

        {/* Strava Connect */}
        <div>
          <div className="text-xs text-neutral-500 uppercase tracking-widest mb-2 px-1">Integrations</div>
          <StravaConnect />
        </div>

        {/* Push notifications */}
        <PushPermission />

        {/* Referral program */}
        <ReferralDashboard />

        {/* Danger zone */}
        <div>
          <div className="text-xs text-neutral-500 uppercase tracking-widest mb-2 px-1">Account</div>
          <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-5 py-4 text-red-400 hover:bg-[#1a1a1a] transition-colors"
            >
              <span className="text-lg">🚪</span>
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>

        <div className="text-center pt-4 pb-6">
          <p className="text-xs text-neutral-600">FORC3 · PhD-Level Coaching at App Prices</p>
          <p className="text-xs text-neutral-700 mt-1">v1.0.0</p>
        </div>
      </div>
    </main>
  );
}
