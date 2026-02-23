"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface StravaActivity {
  id: string | number;
  name: string;
  type: string;
  distance: number;   // meters
  avgPace: number;    // seconds per km
  startDate: string;  // ISO string
}

const TYPE_ICON: Record<string, string> = {
  Run: "🏃",
  Ride: "🚴",
  Swim: "🏊",
};

const COACH_REACTIONS: Record<string, string[]> = {
  Run: [
    "Great run! Keep building that base.",
    "Solid effort out there — consistency wins!",
    "Nice work. Every km counts. 💪",
  ],
  Ride: [
    "Nice ride! Recovery spin tomorrow.",
    "Great time on the bike. Stay hydrated!",
    "Solid cycling session. Keep the legs turning.",
  ],
  Swim: [
    "Smooth in the water! Great swim.",
    "Nice pool session — work on those turns.",
    "Strong swim. Your endurance is building.",
  ],
};

const DEFAULT_REACTIONS = [
  "Solid session. Keep up the great work!",
  "Every workout brings you closer to your goal.",
  "Nice effort! Rest up and go again. 💪",
];

function getTypeIcon(type: string) {
  return TYPE_ICON[type] ?? "🏋️";
}

function getCoachReaction(type: string, index: number): string {
  const pool = COACH_REACTIONS[type] ?? DEFAULT_REACTIONS;
  return pool[index % pool.length];
}

function formatDistance(meters: number): string {
  return (meters / 1000).toFixed(1) + " km";
}

function formatPace(secondsPerKm: number): string {
  if (!secondsPerKm || secondsPerKm <= 0) return "—";
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.round(secondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, "0")} /km`;
}

function formatRelativeDate(iso: string): string {
  const now = new Date();
  const date = new Date(iso);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = todayStart.getTime() - dateStart.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

export default function StravaFeed() {
  const [activities, setActivities] = useState<StravaActivity[] | null>(null);
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/strava/sync");
        if (!res.ok) {
          setConnected(false);
          setActivities([]);
          return;
        }
        const data = await res.json();
        // Support { activities: [...] } or bare array
        const list: StravaActivity[] = Array.isArray(data)
          ? data
          : Array.isArray(data.activities)
          ? data.activities
          : [];
        if (list.length === 0 && data.stravaConnected === false) {
          setConnected(false);
        }
        setActivities(list);
      } catch {
        setConnected(false);
        setActivities([]);
      }
    }
    load();
  }, []);

  const displayed = activities?.slice(0, 5) ?? [];
  const showTeaser = !connected || (activities !== null && activities.length === 0);

  return (
    <div
      className="rounded-xl border flex flex-col"
      style={{ backgroundColor: "#141414", borderColor: "#262626" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-6 py-4 border-b"
        style={{ borderColor: "#262626" }}
      >
        <span
          className="text-sm font-black tracking-widest"
          style={{ color: "#FC4C02" }}
        >
          STRAVA
        </span>
        <h2 className="text-white font-semibold text-base">Recent Activity</h2>
      </div>

      {/* Body */}
      <div className="flex flex-col divide-y" style={{ borderColor: "#262626" }}>
        {activities === null ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex flex-col gap-2">
              <div
                className="h-4 w-48 animate-pulse rounded"
                style={{ backgroundColor: "#262626" }}
              />
              <div
                className="h-3 w-32 animate-pulse rounded"
                style={{ backgroundColor: "#262626" }}
              />
            </div>
          ))
        ) : showTeaser ? (
          <div className="px-6 py-8 flex flex-col items-center gap-3 text-center">
            <span className="text-3xl">🏃</span>
            <p className="text-sm" style={{ color: "#a0a0a0" }}>
              No activities yet.
            </p>
            <Link
              href="/settings"
              className="text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ color: "#0066FF" }}
            >
              Connect Strava to see your runs here →
            </Link>
          </div>
        ) : (
          displayed.map((activity, idx) => (
            <div key={activity.id} className="px-6 py-4 flex flex-col gap-1.5">
              {/* Row 1: icon + name + date */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg leading-none flex-shrink-0">
                    {getTypeIcon(activity.type)}
                  </span>
                  <span className="text-white text-sm font-semibold truncate">
                    {activity.name}
                  </span>
                </div>
                <span
                  className="text-xs flex-shrink-0"
                  style={{ color: "#a0a0a0" }}
                >
                  {formatRelativeDate(activity.startDate)}
                </span>
              </div>

              {/* Row 2: stats */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium" style={{ color: "#0066FF" }}>
                  {formatDistance(activity.distance)}
                </span>
                <span className="text-xs" style={{ color: "#a0a0a0" }}>
                  {formatPace(activity.avgPace)}
                </span>
              </div>

              {/* Row 3: coach reaction */}
              <p className="text-xs italic" style={{ color: "#737373" }}>
                {getCoachReaction(activity.type, idx)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
