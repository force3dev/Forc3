"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StravaConnect from "@/components/StravaConnect";
import PushPermission from "@/components/PushPermission";

const SECTIONS = [
  {
    title: "Account",
    items: [
      { label: "Edit Profile", href: "/settings/profile", icon: "👤" },
      { label: "Subscription & Billing", href: "/settings/upgrade", icon: "⭐" },
    ],
  },
  {
    title: "Training",
    items: [
      { label: "Body Measurements", href: "/progress/measurements", icon: "📏" },
      { label: "Workout History", href: "/history", icon: "📋" },
      { label: "Analytics", href: "/progress/analytics", icon: "📊" },
    ],
  },
  {
    title: "App",
    items: [
      { label: "About FORC3", href: "/about", icon: "ℹ️" },
    ],
  },
];

export default function SettingsPage() {
  const router = useRouter();

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
        {SECTIONS.map(section => (
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

        {/* Strava Connect */}
        <div>
          <div className="text-xs text-neutral-500 uppercase tracking-widest mb-2 px-1">Integrations</div>
          <StravaConnect />
        </div>

        {/* Push notifications */}
        <PushPermission />

        {/* Danger zone */}
        <div>
          <div className="text-xs text-neutral-500 uppercase tracking-widest mb-2 px-1">
            Account
          </div>
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
