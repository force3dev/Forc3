"use client";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-5">
      <div className="text-center max-w-md">
        {/* 404 Large Text */}
        <div className="mb-6">
          <p className="text-[120px] font-black leading-none tracking-tight bg-gradient-to-b from-[#0066FF] to-[#0066FF]/20 bg-clip-text text-transparent select-none">
            404
          </p>
        </div>

        <h1 className="text-xl font-bold mb-2">Page not found</h1>
        <p className="text-neutral-500 text-sm mb-8 leading-relaxed">
          This page doesn&apos;t exist or has been moved. Check the URL or head back to your dashboard.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="w-full py-4 bg-[#0066FF] text-white font-bold rounded-2xl text-sm text-center active:scale-[0.98] transition-transform"
          >
            Back to Home
          </Link>
          <Link
            href="/"
            className="w-full py-4 bg-[#141414] border border-[#262626] text-neutral-400 font-semibold rounded-2xl text-sm text-center active:scale-[0.98] transition-transform"
          >
            Landing Page
          </Link>
        </div>

        <p className="text-xs text-neutral-600 mt-8">
          FORC3 &middot; Lost? That&apos;s okay
        </p>
      </div>
    </main>
  );
}
