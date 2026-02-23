"use client";

import { ExerciseDetailModal } from "@/components/workout/ExerciseDetailModal";

interface ExerciseGuideProps {
  exercise: {
    id: string;
    name: string;
    gifUrl?: string | null;
    muscleGroups: string;
    secondaryMuscles: string;
    formTips: string;
    commonMistakes: string;
    instructions?: string | null;
    category: string;
  };
  onClose: () => void;
}

export default function ExerciseGuide({ exercise, onClose }: ExerciseGuideProps) {
  return <ExerciseDetailModal exercise={exercise} onClose={onClose} />;
}
