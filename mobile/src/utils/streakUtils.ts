import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_STORAGE_KEY = '@taskflow_productivity_streak';

interface StreakData {
  streak: number;
  lastCompletedDate: string; // YYYY-MM-DD
}

const getTodayDateString = (): string => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const getYesterdayDateString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

export const streakUtils = {
  /**
   * Retrieves the current user productivity streak
   */
  getStreak: async (): Promise<number> => {
    try {
      const data = await AsyncStorage.getItem(STREAK_STORAGE_KEY);
      if (!data) return 1; // Default starting streak

      const parsed: StreakData = JSON.parse(data);
      const today = getTodayDateString();
      const yesterday = getYesterdayDateString();

      // If active today or yesterday, streak is intact
      if (parsed.lastCompletedDate === today || parsed.lastCompletedDate === yesterday) {
        return Math.max(1, parsed.streak);
      }

      // If inactive for more than a day, reset streak to 1
      return 1;
    } catch {
      return 1;
    }
  },

  /**
   * Updates streak count when a task is completed
   */
  recordCompletion: async (): Promise<number> => {
    try {
      const today = getTodayDateString();
      const yesterday = getYesterdayDateString();

      const raw = await AsyncStorage.getItem(STREAK_STORAGE_KEY);
      let currentStreak = 1;
      let lastDate = '';

      if (raw) {
        const parsed: StreakData = JSON.parse(raw);
        currentStreak = parsed.streak || 1;
        lastDate = parsed.lastCompletedDate || '';
      }

      if (lastDate === today) {
        // Already recorded today, keep current streak
        return currentStreak;
      } else if (lastDate === yesterday) {
        // Active yesterday! Streak increases!
        currentStreak += 1;
      } else {
        // Gap in days -> restart streak
        currentStreak = 1;
      }

      await AsyncStorage.setItem(
        STREAK_STORAGE_KEY,
        JSON.stringify({ streak: currentStreak, lastCompletedDate: today })
      );

      return currentStreak;
    } catch {
      return 1;
    }
  },
};
