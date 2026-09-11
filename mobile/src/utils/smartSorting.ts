import { Task, PriorityLevel } from '../types';

const PRIORITY_SCORES: Record<PriorityLevel, number> = {
  URGENT: 120,
  HIGH: 80,
  MEDIUM: 40,
  LOW: 15,
};

/**
 * Calculates a dynamic urgency score for a task on the client.
 */
export const calculateClientUrgencyScore = (task: Task): number => {
  if (task.status === 'COMPLETED') {
    const completedTimestamp = task.completedAt ? new Date(task.completedAt).getTime() : 0;
    return -100000000000000 + completedTimestamp;
  }

  let score = 0;

  // 1. Priority Base
  score += PRIORITY_SCORES[task.priority] || 40;

  const now = Date.now();

  // 2. Deadline Urgency
  if (task.deadline) {
    const deadlineTime = new Date(task.deadline).getTime();
    const diffHours = (deadlineTime - now) / (1000 * 60 * 60);

    if (diffHours < 0) {
      // Overdue
      const hoursOverdue = Math.abs(diffHours);
      score += 300 + Math.min(hoursOverdue * 5, 200);
    } else if (diffHours <= 6) {
      score += 250 + (6 - diffHours) * 10;
    } else if (diffHours <= 24) {
      score += 150 + (24 - diffHours) * 4;
    } else if (diffHours <= 72) {
      score += 70 + (72 - diffHours) * 1.5;
    } else {
      score += Math.max(5, 50 - diffHours * 0.1);
    }
  }

  // 3. Age
  const createdTime = new Date(task.createdAt || Date.now()).getTime();
  const ageHours = (now - createdTime) / (1000 * 60 * 60);
  score += Math.min(ageHours * 0.5, 40);

  return score;
};

/**
 * Sorts tasks locally by Smart Mix
 */
export const sortClientTasks = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    return calculateClientUrgencyScore(b) - calculateClientUrgencyScore(a);
  });
};
