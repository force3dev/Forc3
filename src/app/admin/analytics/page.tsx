
"use client";
import Link from "next/link";

export default function AdminAnalyticsPage() {
  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <Link href="/admin" className="text-sm text-neutral-500">← Admin</Link>
        </div>
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-8 text-center text-neutral-500">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-sm">Analytics charts coming soon.</p>
          <p className="text-xs mt-2">Install recharts: npm install recharts</p>
        </div>
      </div>
    </main>
  );
}
