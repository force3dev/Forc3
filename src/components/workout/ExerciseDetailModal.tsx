"use client";
import { motion, AnimatePresence } from "framer-motion";
import { MuscleHighlightDiagram } from "./MuscleHighlightDiagram";

interface Exercise {
  id: string;
  name: string;
  gifUrl?: string | null;
  muscleGroups: string;      // JSON string
  secondaryMuscles: string;  // JSON string
  formTips: string;          // JSON string
  commonMistakes: string;    // JSON string
  instructions?: string | null;
  category: string;
}

interface Props {
  exercise: Exercise;
  onClose: () => void;
}

function parseJSON(str: string): string[] {
  try { return JSON.parse(str) || []; }
  catch { return []; }
}

export function ExerciseDetailModal({ exercise, onClose }: Props) {
  const primary = parseJSON(exercise.muscleGroups);
  const secondary = parseJSON(exercise.secondaryMuscles);
  const formTips = parseJSON(exercise.formTips);
  const mistakes = parseJSON(exercise.commonMistakes);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 z-50 overflow-y-auto"
      >
        <div className="min-h-screen">
          <div className="flex justify-between items-center px-5 pt-8 pb-4 sticky top-0 bg-black/95 border-b border-[#1a1a1a]">
            <h2 className="text-xl font-bold">{exercise.name}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a1a] text-neutral-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="px-5 py-5 space-y-6">
            {/* GIF Demo */}
            {exercise.gifUrl && (
              <div className="rounded-2xl overflow-hidden bg-[#0a0a0a] border border-[#1a1a1a]">
                <img
                  src={exercise.gifUrl}
                  alt={exercise.name}
                  className="w-full max-h-64 object-contain"
                />
              </div>
            )}

            {/* Category badge */}
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-[#0066FF]/20 text-[#0066FF] text-xs font-semibold rounded-full capitalize">
                {exercise.category}
              </span>
              {primary.slice(0, 2).map(m => (
                <span key={m} className="px-3 py-1 bg-[#141414] border border-[#262626] text-xs rounded-full capitalize">
                  {m}
                </span>
              ))}
            </div>

            {/* Muscle Diagram */}
            {(primary.length > 0 || secondary.length > 0) && (
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
                <p className="text-xs text-neutral-500 uppercase tracking-wide font-semibold mb-4">
                  Muscles Worked
                </p>
                <MuscleHighlightDiagram primary={primary} secondary={secondary} />
                <div className="mt-4 space-y-1.5 text-sm">
                  {primary.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#0066FF] flex-shrink-0" />
                      <span className="text-neutral-300 capitalize">{primary.join(", ")}</span>
                      <span className="text-neutral-600 text-xs">(primary)</span>
                    </div>
                  )}
                  {secondary.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#003d99] flex-shrink-0" />
                      <span className="text-neutral-400 capitalize">{secondary.join(", ")}</span>
                      <span className="text-neutral-600 text-xs">(secondary)</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Instructions */}
            {exercise.instructions && (
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
                <p className="text-xs text-neutral-500 uppercase tracking-wide font-semibold mb-3">
                  How To
                </p>
                <p className="text-sm text-neutral-300 leading-relaxed">{exercise.instructions}</p>
              </div>
            )}

            {/* Form Tips */}
            {formTips.length > 0 && (
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
                <p className="text-xs text-neutral-500 uppercase tracking-wide font-semibold mb-3">
                  Form Tips
                </p>
                <div className="space-y-2.5">
                  {formTips.map((tip, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <span className="text-[#00C853] mt-0.5 flex-shrink-0">✓</span>
                      <span className="text-neutral-300">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Common Mistakes */}
            {mistakes.length > 0 && (
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
                <p className="text-xs text-neutral-500 uppercase tracking-wide font-semibold mb-3">
                  Avoid These Mistakes
                </p>
                <div className="space-y-2.5">
                  {mistakes.map((m, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
                      <span className="text-neutral-300">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
