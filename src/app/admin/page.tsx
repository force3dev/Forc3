
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalUsers: number; premiumUsers: number; newUsersThisWeek: number;
  mrr: number; totalWorkouts: number; workoutsThisWeek: number;
  activeToday: number; activeThisWeek: number; avgWorkoutsPerUser: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  const cards = stats ? [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), sub: `+${stats.newUsersThisWeek} this week`, color: "#0066FF" },
    { label: "Premium Users", value: stats.premiumUsers.toLocaleString(), sub: `${Math.round(stats.premiumUsers / Math.max(stats.totalUsers, 1) * 100)}% of users`, color: "#00C853" },
    { label: "MRR", value: `$${stats.mrr.toLocaleString()}`, sub: "Monthly recurring revenue", color: "#FFD700" },
    { label: "Active Today", value: stats.activeToday.toLocaleString(), sub: `${stats.activeThisWeek} this week`, color: "#FF6B00" },
    { label: "Total Workouts", value: stats.totalWorkouts.toLocaleString(), sub: `${stats.workoutsThisWeek} this week`, color: "#0066FF" },
    { label: "Avg Workouts/User", value: stats.avgWorkoutsPerUser, sub: "Per week", color: "#00C853" },
  ] : [];

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold tracking-widest text-[#0066FF]">FORC3 ADMIN</div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>
          <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-white">← App</Link>
        </div>

        {/* Admin nav */}
        <div className="flex gap-2">
          {[{ label: "Overview", href: "/admin" }, { label: "Users", href: "/admin/users" }, { label: "Analytics", href: "/admin/analytics" }, { label: "Content", href: "/admin/content" }].map(n => (
            <Link key={n.href} href={n.href} className="px-4 py-2 bg-[#141414] border border-[#262626] rounded-xl text-sm hover:border-[#0066FF] transition-colors">
              {n.label}
            </Link>
          ))}
        </div>

        {/* Stats grid */}
        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {cards.map(c => (
              <div key={c.label} className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
                <div className="text-xs text-neutral-500 mb-1">{c.label}</div>
                <div className="text-3xl font-black" style={{ color: c.color }}>{c.value}</div>
                <div className="text-xs text-neutral-600 mt-1">{c.sub}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-[#141414] border border-[#262626] rounded-2xl animate-pulse" />)}
          </div>
        )}
      </div>
    </main>
  );
}
