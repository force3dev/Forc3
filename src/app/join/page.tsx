"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ref = searchParams.get("ref");

  useEffect(() => {
    if (ref) {
      localStorage.setItem("forc3_referral_code", ref);
    }
  }, [ref]);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="text-5xl">🎁</div>
        <div>
          <div className="text-xs font-bold tracking-widest text-[#0066FF] mb-2">⚡ FORC3</div>
          <h1 className="text-3xl font-bold">Your friend invited you</h1>
          <p className="text-neutral-400 mt-3 leading-relaxed">
            {ref ? "You unlock a 14-day free trial instead of the standard 7 days." : "Join FORC3 — the hybrid athlete training app."}
          </p>
        </div>
        {ref && (
          <div className="bg-[#00C853]/10 border border-[#00C853]/30 rounded-2xl p-4 text-sm text-[#00C853] font-semibold">
            ✅ 14-day free trial applied
          </div>
        )}
        <div className="space-y-3">
          <Link href="/signup" className="block w-full py-4 bg-[#0066FF] text-white font-bold rounded-2xl text-lg">
            Create Free Account →
          </Link>
          <Link href="/" className="block text-neutral-500 text-sm hover:text-neutral-300">
            Learn more about FORC3
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black" />}>
      <JoinContent />
    </Suspense>
  );
}
