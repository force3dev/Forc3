"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface SetData {
  setNumber: number;
  targetReps: number;
  actualReps: number;
  targetWeight: number;
  actualWeight: number;
  completed: boolean;
}

interface ExerciseData {
  id: string;
  exerciseName: string;
  targetSets: number;
  targetReps: string;
  suggestedWeight: number;
  restSeconds: number;
  notes?: string;
  sets: SetData[];
}

interface SessionData {
  id: string;
  sessionType: string;
  cardioType?: string;
  targetDuration?: number;
  targetDistance?: number;
  notes?: string;
  exercises: ExerciseData[];
}

const SESSION_NAMES: Record<string, string> = {
  push: 'Push', pull: 'Pull', legs: 'Legs',
  upper: 'Upper Body', lower: 'Lower Body', full_body: 'Full Body',
  run: 'Run', bike: 'Cycling', swim: 'Swimming', row: 'Rowing',
};

export default function WorkoutPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  const [progressionResults, setProgressionResults] = useState<any[]>([]);
  const [cardioDuration, setCardioDuration] = useState(0);
  const [cardioDistance, setCardioDistance] = useState(0);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch('/api/workouts/today');
        const data = await res.json();

        if (data.sessions) {
          const found = data.sessions.find((s: any) => s.id === sessionId);
          if (found) {
            const enhanced = {
              ...found,
              exercises: found.exercises.map((ex: any) => {
                const reps = parseInt(ex.targetReps) || 8;
                return {
                  ...ex,
                  sets: Array.from({ length: ex.targetSets }, (_, i) => ({
                    setNumber: i + 1,
                    targetReps: reps,
                    actualReps: reps,
                    targetWeight: ex.suggestedWeight || 45,
                    actualWeight: ex.suggestedWeight || 45,
                    completed: false,
                  })),
                };
              }),
            };
            setSession(enhanced);
            if (found.targetDuration) setCardioDuration(found.targetDuration);
            if (found.targetDistance) setCardioDistance(found.targetDistance);
          }
        }
      } catch (e) {
        console.error('Fetch error:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [sessionId]);

  const updateSet = (exIdx: number, setIdx: number, updates: Partial<SetData>) => {
    if (!session) return;
    const newEx = [...session.exercises];
    newEx[exIdx].sets[setIdx] = { ...newEx[exIdx].sets[setIdx], ...updates };
    setSession({ ...session, exercises: newEx });
  };

  const finishWorkout = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const isCardio = session.exercises.length === 0;
      const body = isCardio ? {
        sessionId: session.id,
        sessionType: session.sessionType,
        duration: cardioDuration,
        distance: cardioDistance,
      } : {
        sessionId: session.id,
        sessionType: session.sessionType,
        exercises: session.exercises.map((ex, i) => ({
          name: ex.exerciseName,
          order: i,
          targetSets: ex.targetSets,
          targetReps: parseInt(ex.targetReps) || 8,
          sets: ex.sets,
        })),
      };

      const res = await fetch('/api/workouts/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setProgressionResults(data.progressionUpdates || []);
      setWorkoutComplete(true);
    } catch (e) {
      console.error('Save error:', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-neutral-500">Loading workout...</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500">Workout not found</p>
          <button onClick={() => router.push('/dashboard')} className="mt-4 underline">
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  if (workoutComplete) {
    return (
      <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-5xl">💪</div>
          <h1 className="text-2xl font-semibold">Workout Complete</h1>
          {progressionResults.length > 0 && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-left">
              <h3 className="text-sm font-medium text-neutral-400 mb-3">Progression Updates</h3>
              {progressionResults.map((p, i) => (
                <div key={i} className="text-sm py-2 border-b border-neutral-800 last:border-0">
                  <div className="font-medium">{p.exercise}</div>
                  <div className="text-neutral-500 text-xs mt-1">{p.message}</div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-4 bg-white text-black font-semibold rounded-xl"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  const isCardio = session.exercises.length === 0;
  const exercise = session.exercises[currentExercise];

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="p-4 border-b border-neutral-900 flex items-center justify-between">
        <button onClick={() => router.push('/dashboard')} className="text-neutral-500">
          ← Exit
        </button>
        <div className="text-sm font-medium">
          {SESSION_NAMES[session.sessionType] || session.sessionType}
        </div>
        <div className="w-12" />
      </header>

      {isCardio ? (
        /* Cardio Workout */
        <div className="p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold">{session.cardioType} {SESSION_NAMES[session.sessionType]}</h2>
            {session.notes && <p className="text-sm text-neutral-500 mt-2">{session.notes}</p>}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-neutral-400">Duration (min)</label>
              <input
                type="number"
                value={cardioDuration}
                onChange={e => setCardioDuration(parseInt(e.target.value) || 0)}
                className="mt-2 w-full p-4 bg-neutral-900 border border-neutral-800 rounded-xl text-center text-2xl"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400">Distance (mi)</label>
              <input
                type="number"
                step="0.1"
                value={cardioDistance}
                onChange={e => setCardioDistance(parseFloat(e.target.value) || 0)}
                className="mt-2 w-full p-4 bg-neutral-900 border border-neutral-800 rounded-xl text-center text-2xl"
              />
            </div>
          </div>

          <button
            onClick={finishWorkout}
            disabled={saving}
            className="w-full py-4 bg-white text-black font-semibold rounded-xl"
          >
            {saving ? 'Saving...' : 'Complete Workout'}
          </button>
        </div>
      ) : (
        /* Strength Workout */
        <div className="p-6">
          {/* Exercise Progress */}
          <div className="flex gap-1 mb-6">
            {session.exercises.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${i <= currentExercise ? 'bg-white' : 'bg-neutral-800'}`}
              />
            ))}
          </div>

          {/* Current Exercise */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold">{exercise.exerciseName}</h2>
            <p className="text-sm text-neutral-500 mt-1">
              {exercise.targetSets} sets × {exercise.targetReps} reps
            </p>
            {exercise.notes && <p className="text-xs text-neutral-600 mt-2">{exercise.notes}</p>}
          </div>

          {/* Sets */}
          <div className="space-y-3 mb-6">
            {exercise.sets.map((set, setIdx) => (
              <div
                key={setIdx}
                className={`p-4 rounded-xl border ${set.completed ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-900 border-neutral-800'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-neutral-500">Set {set.setNumber}</span>
                  {set.completed && <span className="text-xs text-green-500">✓ Done</span>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-neutral-500">Weight</label>
                    <input
                      type="number"
                      value={set.actualWeight}
                      onChange={e => updateSet(currentExercise, setIdx, { actualWeight: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg text-center"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">Reps</label>
                    <input
                      type="number"
                      value={set.actualReps}
                      onChange={e => updateSet(currentExercise, setIdx, { actualReps: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg text-center"
                    />
                  </div>
                </div>
                {!set.completed && (
                  <button
                    onClick={() => updateSet(currentExercise, setIdx, { completed: true })}
                    className="w-full mt-3 py-2 bg-white text-black text-sm font-semibold rounded-lg"
                  >
                    Complete Set
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {currentExercise > 0 && (
              <button
                onClick={() => setCurrentExercise(currentExercise - 1)}
                className="flex-1 py-4 border border-neutral-800 rounded-xl"
              >
                Previous
              </button>
            )}
            {currentExercise < session.exercises.length - 1 ? (
              <button
                onClick={() => setCurrentExercise(currentExercise + 1)}
                className="flex-1 py-4 bg-white text-black font-semibold rounded-xl"
              >
                Next Exercise
              </button>
            ) : (
              <button
                onClick={finishWorkout}
                disabled={saving}
                className="flex-1 py-4 bg-white text-black font-semibold rounded-xl"
              >
                {saving ? 'Saving...' : 'Finish Workout'}
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
