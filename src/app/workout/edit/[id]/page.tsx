"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface ExerciseItem {
  uid: string; // local unique id for dnd
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

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (filter !== "all") params.set("muscle", filter);
    fetch(`/api/exercises?${params}`)
      .then(r => r.json())
      .then(d => setExercises(d.exercises || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, filter]);

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
              onChange={e => setSearch(e.target.value)}
              placeholder="Search exercises..."
              autoFocus
              className="w-full py-3 px-4 bg-[#141414] border border-[#262626] rounded-xl focus:border-[#0066FF] focus:outline-none text-sm"
            />
          </div>

          <div className="flex gap-2 px-5 overflow-x-auto pb-2 mb-2 scrollbar-hide">
            {MUSCLE_GROUPS.map(m => (
              <button
                key={m}
                onClick={() => setFilter(m)}
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
            ) : exercises.length === 0 ? (
              <p className="text-neutral-500 text-sm text-center py-8">No exercises found</p>
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
              <label className="text-xs text-neutral-400 mb-2 block">Muscle Groups (select all that apply)</label>
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

export default function EditWorkoutPage() {
  const router = useRouter();
  const params = useParams();
  const workoutId = params.id as string;

  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    fetch("/api/workouts/today")
      .then(r => r.json())
      .then(d => {
        const w = d.workout;
        if (!w) { router.push("/dashboard"); return; }
        setWorkoutName(w.name || "");
        setExercises(
          (w.exercises || []).map((ex: {
            id: string;
            exerciseId: string;
            name: string;
            muscleGroups: string[];
            sets: number;
            repsMin: number;
            repsMax: number;
            restSeconds: number;
          }, idx: number) => ({
            uid: ex.id || `ex-${idx}`,
            exerciseId: ex.exerciseId,
            name: ex.name,
            muscleGroups: ex.muscleGroups || [],
            order: idx,
            sets: ex.sets || 3,
            repsMin: ex.repsMin || 8,
            repsMax: ex.repsMax || 12,
            restSeconds: ex.restSeconds || 120,
          }))
        );
      })
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    setExercises(prev => {
      const items = Array.from(prev);
      const [moved] = items.splice(result.source.index, 1);
      items.splice(result.destination!.index, 0, moved);
      return items.map((item, idx) => ({ ...item, order: idx }));
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
    setSaving(true);
    try {
      await fetch("/api/workouts/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutId,
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
      router.back();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-black text-white pb-32">
        {/* Header */}
        <header className="px-5 pt-8 pb-4 flex items-center justify-between border-b border-[#1a1a1a]">
          <button onClick={() => router.back()} className="text-neutral-400 text-sm">← Cancel</button>
          <h1 className="font-bold">Edit Workout</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`text-sm font-bold transition-colors ${saving ? "text-neutral-600" : "text-[#0066FF]"}`}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </header>

        <div className="px-5 pt-5 space-y-5">
          {/* Workout name */}
          <input
            type="text"
            value={workoutName}
            onChange={e => setWorkoutName(e.target.value)}
            placeholder="Workout Name"
            className="w-full bg-[#141414] border border-[#262626] rounded-2xl px-4 py-3 text-xl font-bold focus:border-[#0066FF] focus:outline-none"
          />

          {/* Drag-and-drop exercise list */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="exercises">
              {provided => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  {exercises.map((ex, idx) => (
                    <Draggable key={ex.uid} draggableId={ex.uid} index={idx}>
                      {(prov, snapshot) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          className={`bg-[#141414] border rounded-2xl p-4 transition-all ${
                            snapshot.isDragging ? "border-[#0066FF] shadow-lg shadow-[#0066FF]/20" : "border-[#262626]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Drag handle */}
                            <div {...prov.dragHandleProps} className="text-neutral-600 mt-1 cursor-grab active:cursor-grabbing select-none text-lg leading-none">
                              ⋮⋮
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm">{ex.name}</div>
                              <div className="text-xs text-neutral-500 mt-0.5 truncate">
                                {ex.muscleGroups.join(", ")}
                              </div>

                              {/* Sets/Reps editor */}
                              <div className="flex gap-4 mt-3">
                                <div>
                                  <label className="text-[10px] text-neutral-500">Sets</label>
                                  <input
                                    type="number"
                                    value={ex.sets}
                                    onChange={e => updateExercise(ex.uid, { sets: parseInt(e.target.value) || 1 })}
                                    min={1}
                                    max={10}
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
                                      min={1}
                                      className="w-12 bg-[#0a0a0a] border border-[#262626] rounded-lg px-1 py-1.5 text-center text-sm focus:border-[#0066FF] focus:outline-none"
                                    />
                                    <span className="text-neutral-600">–</span>
                                    <input
                                      type="number"
                                      value={ex.repsMax}
                                      onChange={e => updateExercise(ex.uid, { repsMax: parseInt(e.target.value) || 1 })}
                                      min={1}
                                      className="w-12 bg-[#0a0a0a] border border-[#262626] rounded-lg px-1 py-1.5 text-center text-sm focus:border-[#0066FF] focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] text-neutral-500">Rest (s)</label>
                                  <input
                                    type="number"
                                    value={ex.restSeconds}
                                    onChange={e => updateExercise(ex.uid, { restSeconds: parseInt(e.target.value) || 60 })}
                                    step={15}
                                    min={30}
                                    className="block w-16 mt-1 bg-[#0a0a0a] border border-[#262626] rounded-lg px-2 py-1.5 text-center text-sm focus:border-[#0066FF] focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => removeExercise(ex.uid)}
                              className="text-neutral-600 hover:text-red-400 transition-colors text-lg leading-none mt-0.5"
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

          {/* Add exercise button */}
          <button
            onClick={() => setShowAdd(true)}
            className="w-full py-4 border-2 border-dashed border-[#262626] rounded-2xl text-neutral-500 hover:border-[#0066FF] hover:text-[#0066FF] transition-colors text-sm font-semibold"
          >
            + Add Exercise
          </button>
        </div>
      </main>

      {showAdd && (
        <AddExerciseModal onAdd={addExercise} onClose={() => setShowAdd(false)} />
      )}
    </>
  );
}
