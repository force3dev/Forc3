"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface ExerciseItem {
  uid: string;
  exerciseId: string;
  name: string;
  muscleGroups: string[];
  order: number;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
}

interface ExerciseOption {
  id: string;
  name: string;
  category: string;
  muscleGroups: string[];
  equipment: string[];
}

const MUSCLE_GROUPS = ["all", "chest", "back", "shoulders", "biceps", "triceps", "legs", "core", "glutes"];

function AddExerciseModal({
  onAdd,
  onClose,
}: {
  onAdd: (ex: ExerciseOption) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customMuscles, setCustomMuscles] = useState<string[]>([]);
  const [savingCustom, setSavingCustom] = useState(false);

  useState(() => {
    setLoading(true);
    fetch("/api/exercises")
      .then(r => r.json())
      .then(d => setExercises(d.exercises || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  });

  const handleSearch = (q: string) => {
    setSearch(q);
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (filter !== "all") params.set("muscle", filter);
    fetch(`/api/exercises?${params}`)
      .then(r => r.json())
      .then(d => setExercises(d.exercises || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleFilter = (m: string) => {
    setFilter(m);
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (m !== "all") params.set("muscle", m);
    fetch(`/api/exercises?${params}`)
      .then(r => r.json())
      .then(d => setExercises(d.exercises || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  async function saveCustom() {
    if (!customName.trim()) return;
    setSavingCustom(true);
    try {
      const res = await fetch("/api/exercises/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: customName, muscleGroups: customMuscles }),
      });
      const ex = await res.json();
      onAdd(ex);
    } finally {
      setSavingCustom(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-5 pt-8 pb-4">
        <h2 className="text-xl font-bold">Add Exercise</h2>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a1a] text-neutral-400">✕</button>
      </div>

      {!showCustom ? (
        <>
          <div className="px-5 mb-3">
            <input
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search exercises..."
              autoFocus
              className="w-full py-3 px-4 bg-[#141414] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none text-sm"
            />
          </div>

          <div className="flex gap-2 px-5 overflow-x-auto pb-2 mb-2 scrollbar-hide">
            {MUSCLE_GROUPS.map(m => (
              <button
                key={m}
                onClick={() => handleFilter(m)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium capitalize transition-all ${
                  filter === m ? "bg-[#0066FF] text-white" : "bg-[#1a1a1a] text-neutral-400"
                }`}
              >
                {m === "all" ? "All" : m}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-5">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {exercises.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => onAdd(ex)}
                    className="w-full text-left bg-[#141414] border border-[#262626] rounded-xl p-4 hover:border-[#0066FF]/50 transition-colors flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{ex.name}</div>
                      <div className="text-xs text-neutral-500 mt-0.5 truncate">
                        {ex.muscleGroups.join(", ")}
                      </div>
                    </div>
                    <span className="text-neutral-500 text-lg">+</span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowCustom(true)}
              className="w-full mt-4 py-3 text-[#0066FF] text-sm font-semibold"
            >
              + Create Custom Exercise
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 px-5 overflow-y-auto">
          <button onClick={() => setShowCustom(false)} className="text-neutral-400 text-sm mb-4">← Back</button>
          <h3 className="font-bold mb-4">Create Custom Exercise</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-neutral-400">Exercise Name</label>
              <input
                type="text"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="e.g. Landmine Press"
                autoFocus
                className="mt-1.5 w-full p-3 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400 mb-2 block">Muscle Groups</label>
              <div className="flex flex-wrap gap-2">
                {["chest", "back", "shoulders", "biceps", "triceps", "quads", "hamstrings", "glutes", "core", "calves"].map(m => (
                  <button
                    key={m}
                    onClick={() => setCustomMuscles(prev =>
                      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
                    )}
                    className={`px-3 py-1.5 rounded-xl text-sm capitalize transition-all ${
                      customMuscles.includes(m) ? "bg-[#0066FF] text-white" : "bg-[#1a1a1a] text-neutral-400"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCustom(false)}
                className="flex-1 py-3 bg-[#1a1a1a] border border-[#262626] rounded-xl text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={saveCustom}
                disabled={savingCustom || !customName.trim()}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                  savingCustom || !customName.trim()
                    ? "bg-neutral-800 text-neutral-500"
                    : "bg-[#0066FF] text-white"
                }`}
              >
                {savingCustom ? "Saving..." : "Save & Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateWorkoutPage() {
  const router = useRouter();
  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    setExercises(prev => {
      const items = Array.from(prev);
      const [moved] = items.splice(result.source.index, 1);
      items.splice(result.destination!.index, 0, moved);
      return items.map((e, idx) => ({ ...e, order: idx }));
    });
  }, []);

  function addExercise(ex: ExerciseOption) {
    setExercises(prev => [
      ...prev,
      {
        uid: `new-${Date.now()}-${ex.id}`,
        exerciseId: ex.id,
        name: ex.name,
        muscleGroups: ex.muscleGroups,
        order: prev.length,
        sets: 3,
        repsMin: 8,
        repsMax: 12,
        restSeconds: 120,
      },
    ]);
    setShowAdd(false);
  }

  function removeExercise(uid: string) {
    setExercises(prev => prev.filter(e => e.uid !== uid).map((e, idx) => ({ ...e, order: idx })));
  }

  function updateExercise(uid: string, patch: Partial<ExerciseItem>) {
    setExercises(prev => prev.map(e => e.uid === uid ? { ...e, ...patch } : e));
  }

  async function handleSave() {
    if (!workoutName.trim() || exercises.length === 0) return;
    setSaving(true);
    try {
      await fetch("/api/workouts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workoutName,
          exercises: exercises.map(e => ({
            exerciseId: e.exerciseId,
            order: e.order,
            sets: e.sets,
            repsMin: e.repsMin,
            repsMax: e.repsMax,
            restSeconds: e.restSeconds,
          })),
        }),
      });
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <main className="min-h-screen bg-black text-white pb-32">
        <header className="px-5 pt-8 pb-4 flex items-center justify-between border-b border-[#1a1a1a]">
          <button onClick={() => router.back()} className="text-neutral-400 text-sm">← Cancel</button>
          <h1 className="font-bold">Create Workout</h1>
          <div className="w-14" />
        </header>

        <div className="px-5 pt-5 space-y-5">
          <input
            type="text"
            value={workoutName}
            onChange={e => setWorkoutName(e.target.value)}
            placeholder="Workout Name (e.g. Push Day)"
            autoFocus
            className="w-full bg-[#141414] border border-[#262626] rounded-2xl px-4 py-3 text-xl font-bold focus:border-[#0066FF] focus:outline-none"
          />

          {exercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-5xl mb-4">🏋️</div>
              <p className="text-neutral-500 mb-5">No exercises yet</p>
              <button
                onClick={() => setShowAdd(true)}
                className="px-6 py-3 bg-[#0066FF] text-white rounded-xl font-semibold"
              >
                Add First Exercise
              </button>
            </div>
          ) : (
            <>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="create-exercises">
                  {provided => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {exercises.map((ex, idx) => (
                        <Draggable key={ex.uid} draggableId={ex.uid} index={idx}>
                          {(prov, snapshot) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              className={`bg-[#141414] border rounded-2xl p-4 transition-all ${
                                snapshot.isDragging ? "border-[#0066FF]" : "border-[#262626]"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div {...prov.dragHandleProps} className="text-neutral-600 mt-1 cursor-grab text-lg leading-none select-none">
                                  ⋮⋮
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm">{ex.name}</div>
                                  <div className="text-xs text-neutral-500 mt-0.5 truncate">{ex.muscleGroups.join(", ")}</div>

                                  <div className="flex gap-4 mt-3">
                                    <div>
                                      <label className="text-[10px] text-neutral-500">Sets</label>
                                      <input
                                        type="number"
                                        value={ex.sets}
                                        onChange={e => updateExercise(ex.uid, { sets: parseInt(e.target.value) || 1 })}
                                        min={1}
                                        className="block w-14 mt-1 bg-[#0a0a0a] border border-[#262626] rounded-lg px-2 py-1.5 text-center text-sm focus:border-[#0066FF] focus:outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-neutral-500">Reps</label>
                                      <div className="flex items-center gap-1 mt-1">
                                        <input
                                          type="number"
                                          value={ex.repsMin}
                                          onChange={e => updateExercise(ex.uid, { repsMin: parseInt(e.target.value) || 1 })}
                                          className="w-12 bg-[#0a0a0a] border border-[#262626] rounded-lg px-1 py-1.5 text-center text-sm focus:border-[#0066FF] focus:outline-none"
                                        />
                                        <span className="text-neutral-600">–</span>
                                        <input
                                          type="number"
                                          value={ex.repsMax}
                                          onChange={e => updateExercise(ex.uid, { repsMax: parseInt(e.target.value) || 1 })}
                                          className="w-12 bg-[#0a0a0a] border border-[#262626] rounded-lg px-1 py-1.5 text-center text-sm focus:border-[#0066FF] focus:outline-none"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeExercise(ex.uid)}
                                  className="text-neutral-600 hover:text-red-400 transition-colors text-lg leading-none"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              <button
                onClick={() => setShowAdd(true)}
                className="w-full py-4 border-2 border-dashed border-[#262626] rounded-2xl text-neutral-500 hover:border-[#0066FF] hover:text-[#0066FF] transition-colors text-sm font-semibold"
              >
                + Add Exercise
              </button>

              <button
                onClick={handleSave}
                disabled={saving || !workoutName.trim()}
                className={`w-full py-4 font-bold rounded-2xl transition-all ${
                  saving || !workoutName.trim()
                    ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                    : "bg-[#0066FF] text-white hover:bg-[#0052CC]"
                }`}
              >
                {saving ? "Saving..." : "Save Workout"}
              </button>
            </>
          )}
        </div>
      </main>

      {showAdd && (
        <AddExerciseModal onAdd={addExercise} onClose={() => setShowAdd(false)} />
      )}
    </>
  );
}
