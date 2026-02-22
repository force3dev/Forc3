"use client";
import { ReactNode } from "react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

interface PullToRefreshWrapperProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export default function PullToRefreshWrapper({ onRefresh, children }: PullToRefreshWrapperProps) {
  const { pullDistance, pullProgress, refreshing } = usePullToRefresh({ onRefresh });

  return (
    <div>
      {/* Pull indicator */}
      <div
        style={{
          height: `${Math.max(0, pullDistance * 0.5)}px`,
          overflow: "hidden",
          transition: pullDistance === 0 ? "height 0.2s ease" : "none",
        }}
        className="flex items-center justify-center"
      >
        {(pullDistance > 0 || refreshing) && (
          <div className="flex flex-col items-center gap-1 py-2">
            {refreshing ? (
              <div className="w-5 h-5 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
            ) : (
              <div
                className="w-5 h-5 border-2 border-[#0066FF] border-t-transparent rounded-full"
                style={{
                  transform: `rotate(${pullProgress * 360}deg)`,
                  opacity: pullProgress,
                }}
              />
            )}
            <span className="text-[10px] text-neutral-500">
              {refreshing ? "Refreshing..." : pullProgress >= 1 ? "Release to refresh" : "Pull to refresh"}
            </span>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
