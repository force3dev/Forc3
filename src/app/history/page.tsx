"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface SetLog {
  setNumber: number;
  actualReps: number;
  actualWeight: number;
  completed: boolean;
}

interface ExerciseLog {
  id: string;
  exerciseName: string;
  exerciseOrder: number;
  sets: SetLog[];
}

interface WorkoutLog {
  id: string;
  date: string;
  sessionType: string;
  status: string;
  actualDuration?: number;
  actualDistance?: number;
  perceivedEffort?: number;
  notes?: string;
  exerciseLogs: ExerciseLog[];
}

const SESSION_LABELS: Record<string, string> = {
  push: "Push", pull: "Pull", legs: "Legs",
  upper: "Upper Body", lower: "Lower Body", full_body: "Full Body",
  run: "Run", bike: "Cycling", swim: "Swimming", row: "Rowing",
  custom: "Workout",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/workouts/log")
      .then(r => r.json())
      .then(d => setLogs(d.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      <header className="p-6 pb-4">
        <div className="text-xs font-semibold tracking-widest text-neutral-500">FORCE3</div>
        <h1 className="text-xl font-semibold mt-1">History</h1>
        <p className="text-sm text-neutral-500 mt-0.5">{logs.length} workouts logged</p>
      </header>

      <div className="px-6 space-y-3">
        {loading && (
          <div className="text-center text-neutral-600 text-sm py-8">Loading...</div>
        )}

        {!loading && logs.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <p className="text-neutral-500">No workouts logged yet.</p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-white text-black font-semibold rounded-xl text-sm"
            >
              Start Today's Workout
            </Link>
          </div>
        )}

        {logs.map(log => {
          const isExpanded = expanded === log.id;
          const isStrength = log.exerciseLogs.length > 0;
          const sessionLabel = SESSION_LABELS[log.sessionType] || log.sessionType;

          // Best set per exercise (heaviest weight)
          const exerciseSummaries = log.exerciseLogs.map(ex => {
            const completedSets = ex.sets.filter(s => s.completed);
            const bestSet = completedSets.reduce(
              (best, s) => (!best || s.actualWeight > best.actualWeight ? s : best),
              null as SetLog | null
            );
            return { name: ex.exerciseName, sets: completedSets.length, best: bestSet };
          });

          return (
            <div key={log.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpanded(isExpanded ? null : log.id)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">{sessionLabel}</div>
                    {log.perceivedEffort && (
                      <div className="text-xs bg-neutral-800 px-2 py-0.5 rounded-full text-neutral-400">
                        RPE {log.perceivedEffort}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-2">
                    <span>{formatDate(log.date)}</span>
                    {isStrength && <span>· {log.exerciseLogs.length} exercises</span>}
                    {log.actualDuration && <span>· {log.actualDuration} min</span>}
                    {log.actualDistance && <span>· {log.actualDistance} mi</span>}
                  </div>
                </div>
                <div className="text-neutral-600 text-lg">{isExpanded ? "−" : "+"}</div>
              </button>

              {isExpanded && (
                <div className="border-t border-neutral-800">
                  {isStrength ? (
                    <div className="divide-y divide-neutral-800">
                      {exerciseSummaries.map((ex, i) => (
                        <div key={i} className="px-4 py-3 flex items-center justify-between">
                          <div className="text-sm">{ex.name}</div>
                          <div className="text-xs text-neutral-500 text-right">
                            {ex.sets} sets
                            {ex.best && ` · ${ex.best.actualWeight} lbs × ${ex.best.actualReps}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 space-y-2">
                      {log.actualDuration && (
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-400">Duration</span>
                          <span>{log.actualDuration} min</span>
                        </div>
                      )}
                      {log.actualDistance && (
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-400">Distance</span>
                          <span>{log.actualDistance} mi</span>
                        </div>
                      )}
                      {log.notes && <p className="text-xs text-neutral-500 pt-1">{log.notes}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-neutral-900 px-6 py-4">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <Link href="/dashboard" className="flex flex-col items-center text-neutral-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link href="/plan" className="flex flex-col items-center text-neutral-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs mt-1">Plan</span>
          </Link>
          <Link href="/nutrition" className="flex flex-col items-center text-neutral-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs mt-1">Nutrition</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center text-neutral-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
