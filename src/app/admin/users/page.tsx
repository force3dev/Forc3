
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface AdminUser {
  id: string; email: string; displayName: string | null;
  createdAt: string; subscription: { tier: string } | null;
  streak: { currentStreak: number } | null;
  _count: { workoutLogs: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");

  function load() {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("q", search);
    if (tierFilter) params.set("tier", tierFilter);
    fetch(`/api/admin/users?${params}`)
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setTotal(d.total || 0); })
      .catch(() => {});
  }

  useEffect(() => { load(); }, [page, search, tierFilter]); // eslint-disable-line

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Users ({total})</h1>
          <Link href="/admin" className="text-sm text-neutral-500">← Admin</Link>
        </div>

        <div className="flex gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email or name..."
            className="flex-1 bg-[#141414] border border-[#262626] rounded-xl px-4 py-2 text-sm" />
          <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
            className="bg-[#141414] border border-[#262626] rounded-xl px-3 py-2 text-sm">
            <option value="">All tiers</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="elite">Elite</option>
          </select>
        </div>

        <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-[#262626]">
              <tr className="text-left text-neutral-500 text-xs">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Workouts</th>
                <th className="px-4 py-3">Streak</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]">
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.displayName || u.email.split('@')[0]}</div>
                    <div className="text-xs text-neutral-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.subscription?.tier !== 'free' ? 'bg-[#0066FF]/20 text-[#0066FF]' : 'bg-[#262626] text-neutral-400'}`}>
                      {u.subscription?.tier || 'free'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-300">{u._count.workoutLogs}</td>
                  <td className="px-4 py-3">{u.streak?.currentStreak || 0}🔥</td>
                  <td className="px-4 py-3 text-neutral-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3 justify-center">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 bg-[#141414] border border-[#262626] rounded-xl text-sm disabled:opacity-40">Prev</button>
          <span className="px-4 py-2 text-sm text-neutral-400">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 bg-[#141414] border border-[#262626] rounded-xl text-sm">Next</button>
        </div>
      </div>
    </main>
  );
}
