import { Share, Alert } from 'react-native';
import { Task, TaskStats } from '../types';
import { formatDate, getDeadlineStatus } from './dateUtils';

/**
 * Generates a clean Markdown briefing of the user's tasks
 */
export const generateDailyBriefingMarkdown = (
  tasks: Task[],
  stats: TaskStats,
  userName?: string
): string => {
  const dateStr = formatDate(new Date().toISOString());
  const pendingTasks = tasks.filter((t) => t.status === 'PENDING');
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const completionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  let briefing = `📋 *TaskFlow Daily Briefing — ${dateStr}*\n`;
  if (userName) briefing += `Prepared for: ${userName}\n`;
  briefing += `Progress: ${stats.completed}/${stats.total} Completed (${completionRate}%)\n\n`;

  if (stats.overdue > 0) {
    briefing += `⚠️ *OVERDUE TASKS (${stats.overdue})*\n`;
    pendingTasks
      .filter((t) => {
        const d = getDeadlineStatus(t.deadline, false);
        return d.isOverdue;
      })
      .forEach((t) => {
        const dl = getDeadlineStatus(t.deadline, false);
        briefing += `• [${t.priority}] ${t.title} — ${dl.label}\n`;
      });
    briefing += `\n`;
  }

  briefing += `⏳ *PENDING TASKS (${pendingTasks.length})*\n`;
  if (pendingTasks.length === 0) {
    briefing += `• No pending tasks! All caught up 🎉\n`;
  } else {
    pendingTasks.forEach((t) => {
      const dl = getDeadlineStatus(t.deadline, false);
      const subInfo =
        t.subtasks && t.subtasks.length > 0
          ? ` (${t.subtasks.filter((s) => s.isCompleted).length}/${t.subtasks.length} subtasks)`
          : '';
      briefing += `• [${t.priority}] ${t.title}${subInfo} — ${dl.label}\n`;
    });
  }
  briefing += `\n`;

  if (completedTasks.length > 0) {
    briefing += `✅ *RECENTLY COMPLETED (${completedTasks.length})*\n`;
    completedTasks.slice(0, 5).forEach((t) => {
      briefing += `• ✓ ${t.title}\n`;
    });
    briefing += `\n`;
  }

  briefing += `Generated with TaskFlow Mobile App 🚀`;
  return briefing;
};

/**
 * Opens native share sheet with daily briefing text
 */
export const shareDailyBriefing = async (
  tasks: Task[],
  stats: TaskStats,
  userName?: string
): Promise<void> => {
  try {
    const message = generateDailyBriefingMarkdown(tasks, stats, userName);
    await Share.share({
      title: 'Daily TaskFlow Briefing',
      message,
    });
  } catch (error: any) {
    Alert.alert('Share Failed', error.message || 'Could not export briefing.');
  }
};
