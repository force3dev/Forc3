"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Exercise {
  id: string;
  exerciseName: string;
  exerciseOrder: number;
  targetSets: number;
  targetReps: string;
  targetWeight?: number;
  restSeconds: number;
  notes?: string;
}

interface Session {
  id: string;
  dayOfWeek: string;
  sessionType: string;
  sessionOrder: number;
  exercises: Exercise[];
  cardioType?: string;
  targetDuration?: number;
  targetDistance?: number;
  notes?: string;
}

interface Week {
  id: string;
  weekNumber: number;
  isDeload: boolean;
  sessions: Session[];
}

interface Plan {
  name: string;
  description?: string;
  splitType?: string;
  totalWeeks: number;
  currentWeek: number;
  weeks: Week[];
}

const DAY_LABELS: Record<string, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu',
  fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

const SESSION_LABELS: Record<string, string> = {
  push: 'Push', pull: 'Pull', legs: 'Legs',
  upper: 'Upper Body', lower: 'Lower Body', full_body: 'Full Body',
  run: 'Run', bike: 'Cycling', swim: 'Swimming', row: 'Rowing',
  core: 'Core', mobility: 'Mobility',
};

const ORDERED_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function PlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/plan")
      .then(r => r.json())
      .then(data => {
        if (data.plan) {
          setPlan(data.plan);
          setSelectedWeek(data.plan.currentWeek);
        } else {
          setError(data.error || "No plan found");
        }
      })
      .catch(() => setError("Failed to load plan"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-neutral-500">Loading plan...</div>
      </main>
    );
  }

  if (error || !plan) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-neutral-400">{error || "No plan found"}</p>
          <button
            onClick={() => router.push("/onboarding")}
            className="px-6 py-3 bg-white text-black font-semibold rounded-xl"
          >
            Complete Onboarding
          </button>
        </div>
      </main>
    );
  }

  const currentWeekData = plan.weeks.find(w => w.weekNumber === selectedWeek);

  // Sort sessions by day order
  const sortedSessions = currentWeekData
    ? [...currentWeekData.sessions].sort(
        (a, b) => ORDERED_DAYS.indexOf(a.dayOfWeek) - ORDERED_DAYS.indexOf(b.dayOfWeek)
      )
    : [];

  // Group by day
  const sessionsByDay: Record<string, Session[]> = {};
  for (const session of sortedSessions) {
    if (!sessionsByDay[session.dayOfWeek]) sessionsByDay[session.dayOfWeek] = [];
    sessionsByDay[session.dayOfWeek].push(session);
  }

  // Build rest days (days in the week not in sessions)
  const activeDays = new Set(sortedSessions.map(s => s.dayOfWeek));
  const restDays = ORDERED_DAYS.filter(d => !activeDays.has(d));

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="p-6 pb-4">
        <div className="text-xs font-semibold tracking-widest text-neutral-500">FORCE3</div>
        <h1 className="text-xl font-semibold mt-1">{plan.name || "My Plan"}</h1>
        {plan.splitType && (
          <p className="text-sm text-neutral-500 mt-0.5">{plan.splitType} · {plan.totalWeeks} weeks</p>
        )}
      </header>

      {/* Week Selector */}
      <div className="px-6 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {plan.weeks.map(w => (
            <button
              key={w.weekNumber}
              onClick={() => setSelectedWeek(w.weekNumber)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedWeek === w.weekNumber
                  ? "bg-white text-black"
                  : "bg-neutral-900 border border-neutral-800 text-neutral-400"
              }`}
            >
              {w.weekNumber === plan.currentWeek ? "▶ " : ""}Week {w.weekNumber}
              {w.isDeload && " · Deload"}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions */}
      <div className="px-6 space-y-3">
        {currentWeekData?.isDeload && (
          <div className="p-4 bg-amber-900/20 border border-amber-800/50 rounded-xl">
            <p className="text-amber-400 text-sm font-medium">Deload Week</p>
            <p className="text-amber-500/70 text-xs mt-1">Reduced volume. Focus on form and recovery.</p>
          </div>
        )}

        {ORDERED_DAYS.map(day => {
          const daySessions = sessionsByDay[day];
          const isRest = !daySessions;

          if (isRest) {
            return (
              <div key={day} className="flex items-center gap-4 py-3">
                <div className="w-10 text-xs font-medium text-neutral-600 uppercase">{DAY_LABELS[day]}</div>
                <div className="text-sm text-neutral-700">Rest</div>
              </div>
            );
          }

          return (
            <div key={day}>
              {daySessions.map(session => {
                const isExpanded = expandedSession === session.id;
                const isCardio = session.exercises.length === 0;

                return (
                  <div key={session.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden mb-3">
                    <button
                      onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                      className="w-full p-4 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 text-xs font-medium text-neutral-500 uppercase">{DAY_LABELS[day]}</div>
                        <div>
                          <div className="font-medium text-sm">
                            {SESSION_LABELS[session.sessionType] || session.sessionType}
                            {session.cardioType && ` · ${session.cardioType}`}
                          </div>
                          <div className="text-xs text-neutral-500 mt-0.5">
                            {isCardio
                              ? `${session.targetDuration ? session.targetDuration + " min" : ""}${session.targetDistance ? " · " + session.targetDistance + " mi" : ""}`
                              : `${session.exercises.length} exercises`}
                          </div>
                        </div>
                      </div>
                      <div className="text-neutral-600 text-lg">{isExpanded ? "−" : "+"}</div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-neutral-800">
                        {isCardio ? (
                          <div className="p-4 space-y-2">
                            {session.targetDuration && (
                              <div className="flex justify-between text-sm">
                                <span className="text-neutral-400">Duration</span>
                                <span>{session.targetDuration} min</span>
                              </div>
                            )}
                            {session.targetDistance && (
                              <div className="flex justify-between text-sm">
                                <span className="text-neutral-400">Distance</span>
                                <span>{session.targetDistance} mi</span>
                              </div>
                            )}
                            {session.notes && (
                              <p className="text-xs text-neutral-500 pt-2">{session.notes}</p>
                            )}
                          </div>
                        ) : (
                          <div className="divide-y divide-neutral-800">
                            {session.exercises.map((ex, i) => (
                              <div key={ex.id} className="px-4 py-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="text-sm font-medium">{ex.exerciseName}</div>
                                    {ex.notes && (
                                      <div className="text-xs text-neutral-500 mt-0.5">{ex.notes}</div>
                                    )}
                                  </div>
                                  <div className="text-xs text-neutral-500 text-right ml-4 flex-shrink-0">
                                    <div>{ex.targetSets} × {ex.targetReps}</div>
                                    {ex.targetWeight && <div>{ex.targetWeight} lbs</div>}
                                    <div>{ex.restSeconds}s rest</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
          <Link href="/plan" className="flex flex-col items-center text-white">
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
