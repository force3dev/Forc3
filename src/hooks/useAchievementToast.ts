import { create } from "zustand";

interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface AchievementToastStore {
  queue: Achievement[];
  current: Achievement | null;
  show: (achievement: Achievement) => void;
  dismiss: () => void;
}

export const useAchievementToast = create<AchievementToastStore>((set, get) => ({
  queue: [],
  current: null,

  show: (achievement) => {
    const { current, queue } = get();
    if (!current) {
      set({ current: achievement });
    } else {
      set({ queue: [...queue, achievement] });
    }
  },

  dismiss: () => {
    const { queue } = get();
    if (queue.length > 0) {
      set({ current: queue[0], queue: queue.slice(1) });
    } else {
      set({ current: null });
    }
  },
}));
