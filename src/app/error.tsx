"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-5">
      <div className="text-center max-w-md">
        {/* Error Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#FF5252]/10 border border-[#FF5252]/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-[#FF5252]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-neutral-500 text-sm mb-8 leading-relaxed">
          An unexpected error occurred. This has been logged and we are working on fixing it.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full py-4 bg-[#0066FF] text-white font-bold rounded-2xl text-sm active:scale-[0.98] transition-transform"
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="w-full py-4 bg-[#141414] border border-[#262626] text-neutral-400 font-semibold rounded-2xl text-sm text-center active:scale-[0.98] transition-transform"
          >
            Back to Home
          </Link>
        </div>

        {/* Error digest for debugging */}
        {error.digest && (
          <p className="text-[10px] text-neutral-700 mt-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <p className="text-xs text-neutral-600 mt-6">
          FORC3 &middot; We&apos;ll get this sorted
        </p>
      </div>
    </main>
  );
}
