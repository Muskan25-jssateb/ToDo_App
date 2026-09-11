import { Colors } from '../theme/colors';

/**
 * Formats an ISO date string into a user-friendly date format (e.g. "Sep 12, 2026")
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Formats an ISO date string into time format (e.g. "04:30 PM")
 */
export const formatTime = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formats full datetime
 */
export const formatDateTime = (dateString?: string): string => {
  if (!dateString) return 'Not set';
  return `${formatDate(dateString)} at ${formatTime(dateString)}`;
};

export interface DeadlineStatus {
  label: string;
  isOverdue: boolean;
  isUrgent: boolean; // within 24 hours
  badgeColor: string;
  badgeBg: string;
}

/**
 * Analyzes a deadline relative to current time
 */
export const getDeadlineStatus = (
  deadlineString?: string,
  isCompleted: boolean = false
): DeadlineStatus => {
  if (!deadlineString) {
    return {
      label: 'No deadline',
      isOverdue: false,
      isUrgent: false,
      badgeColor: Colors.textMuted,
      badgeBg: 'rgba(100, 116, 139, 0.1)',
    };
  }

  if (isCompleted) {
    return {
      label: 'Completed',
      isOverdue: false,
      isUrgent: false,
      badgeColor: Colors.completed,
      badgeBg: Colors.completedMuted,
    };
  }

  const deadline = new Date(deadlineString).getTime();
  const now = Date.now();
  const diffMs = deadline - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 0) {
    const hoursAgo = Math.floor(Math.abs(diffHours));
    const daysAgo = Math.floor(hoursAgo / 24);
    const text = daysAgo > 0 ? `${daysAgo}d overdue` : `${hoursAgo}h overdue`;
    return {
      label: `⚠️ ${text}`,
      isOverdue: true,
      isUrgent: true,
      badgeColor: Colors.urgent,
      badgeBg: Colors.urgentMuted,
    };
  }

  if (diffHours <= 6) {
    const hoursLeft = Math.max(1, Math.round(diffHours));
    return {
      label: `🔥 Due in ${hoursLeft}h`,
      isOverdue: false,
      isUrgent: true,
      badgeColor: Colors.urgent,
      badgeBg: Colors.urgentMuted,
    };
  }

  if (diffHours <= 24) {
    const hoursLeft = Math.round(diffHours);
    return {
      label: `⏰ Due in ${hoursLeft}h`,
      isOverdue: false,
      isUrgent: true,
      badgeColor: Colors.high,
      badgeBg: Colors.highMuted,
    };
  }

  if (diffHours <= 48) {
    return {
      label: '📅 Due tomorrow',
      isOverdue: false,
      isUrgent: false,
      badgeColor: Colors.medium,
      badgeBg: Colors.mediumMuted,
    };
  }

  const daysLeft = Math.round(diffHours / 24);
  return {
    label: `📅 Due in ${daysLeft} days`,
    isOverdue: false,
    isUrgent: false,
    badgeColor: Colors.textSecondary,
    badgeBg: Colors.surfaceLight,
  };
};
