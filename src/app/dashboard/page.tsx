"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Exercise {
  id: string;
  exerciseName: string;
  targetSets: number;
  targetReps: string;
  suggestedWeight?: number;
  restSeconds: number;
  notes?: string;
}

interface Session {
  id: string;
  sessionType: string;
  sessionOrder: number;
  exercises: Exercise[];
  cardioType?: string;
  targetDuration?: number;
  targetDistance?: number;
  notes?: string;
}

interface TodayData {
  isRestDay: boolean;
  dayOfWeek: string;
  currentWeek: number;
  isDeload?: boolean;
  sessions?: Session[];
  message?: string;
  needsOnboarding?: boolean;
}

interface NutritionData {
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  caloriesConsumed: number;
  proteinConsumed: number;
}

const DAY_NAMES: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

const SESSION_NAMES: Record<string, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  upper: 'Upper Body',
  lower: 'Lower Body',
  full_body: 'Full Body',
  run: 'Run',
  bike: 'Cycling',
  swim: 'Swimming',
  row: 'Rowing',
  core: 'Core',
  mobility: 'Mobility',
};

const CARDIO_NAMES: Record<string, string> = {
  easy: 'Easy',
  tempo: 'Tempo',
  intervals: 'Intervals',
  long: 'Long',
  recovery: 'Recovery',
};

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState<TodayData | null>(null);
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch today's workout
        const todayRes = await fetch('/api/workouts/today');
        const todayData = await todayRes.json();
        
        if (todayData.needsOnboarding) {
          router.push('/onboarding');
          return;
        }
        
        setToday(todayData);
        
        // Fetch nutrition data (placeholder for now)
        // In real implementation, we'd calculate from today's meal logs
        setNutrition({
          calorieTarget: 2200,
          proteinTarget: 180,
          carbsTarget: 220,
          fatTarget: 70,
          caloriesConsumed: 0,
          proteinConsumed: 0,
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-neutral-500">Loading...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-sm underline text-neutral-400"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold tracking-widest text-neutral-500">FORCE3</div>
            <h1 className="text-xl font-semibold mt-1">
              {today?.dayOfWeek ? DAY_NAMES[today.dayOfWeek] : 'Today'}
            </h1>
          </div>
          <div className="text-right">
            <div className="text-xs text-neutral-500">WEEK {today?.currentWeek || 1}</div>
            {today?.isDeload && (
              <div className="text-xs text-amber-500 mt-0.5">Deload Week</div>
            )}
          </div>
        </div>
      </header>

      <div className="px-6 space-y-6 pb-24">
        {/* Today's Workout Card */}
        {today?.isRestDay ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <div className="text-center space-y-3">
              <div className="text-4xl">😴</div>
              <h2 className="text-lg font-medium">Rest Day</h2>
              <p className="text-sm text-neutral-500">
                {today.message || "Recover well. Your body grows when you rest."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {today?.sessions?.map((session, idx) => (
              <div key={session.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                {/* Session Header */}
                <div className="p-4 border-b border-neutral-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-neutral-500 uppercase tracking-wide">
                        {session.sessionOrder === 2 ? 'PM Session' : today.sessions && today.sessions.length > 1 ? 'AM Session' : 'Today'}
                      </div>
                      <h2 className="text-lg font-semibold mt-0.5">
                        {SESSION_NAMES[session.sessionType] || session.sessionType}
                        {session.cardioType && ` — ${CARDIO_NAMES[session.cardioType] || session.cardioType}`}
                      </h2>
                    </div>
                    <Link
                      href={`/workout/${session.id}`}
                      className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
                    >
                      Start
                    </Link>
                  </div>
                </div>
                
                {/* Exercise Preview or Cardio Details */}
                <div className="p-4">
                  {session.exercises.length > 0 ? (
                    <div className="space-y-3">
                      {session.exercises.slice(0, 4).map((exercise, i) => (
                        <div key={exercise.id} className="flex items-center justify-between">
                          <span className="text-sm text-neutral-300">{exercise.exerciseName}</span>
                          <span className="text-xs text-neutral-500">
                            {exercise.targetSets} × {exercise.targetReps}
                            {exercise.suggestedWeight && ` @ ${exercise.suggestedWeight} lbs`}
                          </span>
                        </div>
                      ))}
                      {session.exercises.length > 4 && (
                        <div className="text-xs text-neutral-500">
                          +{session.exercises.length - 4} more exercises
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {session.targetDuration && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-300">Duration</span>
                          <span className="text-sm text-neutral-500">{session.targetDuration} min</span>
                        </div>
                      )}
                      {session.targetDistance && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-300">Distance</span>
                          <span className="text-sm text-neutral-500">{session.targetDistance} mi</span>
                        </div>
                      )}
                      {session.notes && (
                        <p className="text-xs text-neutral-500 mt-2">{session.notes}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Nutrition Card */}
        {nutrition && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Nutrition</h3>
              <Link href="/nutrition" className="text-xs text-neutral-500 hover:text-white transition-colors">
                Log meal →
              </Link>
            </div>
            
            <div className="space-y-3">
              {/* Calories */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-neutral-400">Calories</span>
                  <span>{nutrition.caloriesConsumed} / {nutrition.calorieTarget}</span>
                </div>
                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${Math.min(100, (nutrition.caloriesConsumed / nutrition.calorieTarget) * 100)}%` }}
                  />
                </div>
              </div>
              
              {/* Protein */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-neutral-400">Protein</span>
                  <span>{nutrition.proteinConsumed}g / {nutrition.proteinTarget}g</span>
                </div>
                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (nutrition.proteinConsumed / nutrition.proteinTarget) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/history" className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 hover:border-neutral-700 transition-colors">
            <div className="text-xs text-neutral-500 uppercase tracking-wide">This Week</div>
            <div className="text-2xl font-semibold mt-1">0 / 4</div>
            <div className="text-xs text-neutral-500 mt-0.5">workouts</div>
          </Link>
          
          <Link href="/progress" className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 hover:border-neutral-700 transition-colors">
            <div className="text-xs text-neutral-500 uppercase tracking-wide">Streak</div>
            <div className="text-2xl font-semibold mt-1">0</div>
            <div className="text-xs text-neutral-500 mt-0.5">days</div>
          </Link>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-neutral-900 px-6 py-4">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <Link href="/dashboard" className="flex flex-col items-center text-white">
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
