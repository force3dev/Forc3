"use client";

import { useEffect, useState } from "react";

interface Profile {
  stravaConnected: boolean;
  stravaAthleteId?: string;
  stravaLastSync?: string;
}

export default function StravaConnect() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch {
      setProfile({ stravaConnected: false });
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  async function handleSync() {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/strava/sync", { method: "POST" });
      if (res.ok) {
        setSyncMessage("Synced successfully!");
        await fetchProfile();
      } else {
        setSyncMessage("Sync failed. Try again.");
      }
    } catch {
      setSyncMessage("Sync failed. Try again.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/strava/auth", { method: "DELETE" });
      if (res.ok) {
        await fetchProfile();
      }
    } finally {
      setDisconnecting(false);
    }
  }

  function formatLastSync(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div
      className="rounded-xl border p-6 flex flex-col gap-4"
      style={{ backgroundColor: "#141414", borderColor: "#262626" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <span
          className="text-lg font-black tracking-widest"
          style={{ color: "#FC4C02" }}
        >
          STRAVA
        </span>
        <span className="text-white font-semibold text-base">Integration</span>
      </div>

      {profile === null ? (
        <div className="h-6 w-32 animate-pulse rounded" style={{ backgroundColor: "#262626" }} />
      ) : !profile.stravaConnected ? (
        <>
          <p className="text-sm" style={{ color: "#a0a0a0" }}>
            Sync your runs and rides automatically.
          </p>
          <a
            href="/api/strava/auth"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 w-fit"
            style={{ backgroundColor: "#FC4C02" }}
          >
            Connect Strava
          </a>
        </>
      ) : (
        <>
          {/* Connected badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-green-900/40 text-green-400 border border-green-800">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
              Strava Connected ✓
            </span>
          </div>

          {/* Last sync */}
          {profile.stravaLastSync && (
            <p className="text-xs" style={{ color: "#a0a0a0" }}>
              Last synced: {formatLastSync(profile.stravaLastSync)}
            </p>
          )}

          {syncMessage && (
            <p
              className="text-xs"
              style={{ color: syncMessage.includes("fail") ? "#f87171" : "#4ade80" }}
            >
              {syncMessage}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: "#0066FF" }}
            >
              {syncing ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Syncing…
                </>
              ) : (
                "Sync Now"
              )}
            </button>

            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors hover:bg-red-900/30 disabled:opacity-50"
              style={{ color: "#f87171", border: "1px solid #262626" }}
            >
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
