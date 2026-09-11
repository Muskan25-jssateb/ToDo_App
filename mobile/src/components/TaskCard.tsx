import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Task } from '../types';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { PriorityBadge } from './PriorityBadge';
import { getDeadlineStatus, formatTime, formatDate } from '../utils/dateUtils';

interface TaskCardProps {
  task: Task;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onPress: (task: Task) => void;
  onSnooze?: (id: string, hours: number) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleStatus,
  onDelete,
  onPress,
  onSnooze,
}) => {
  const isCompleted = task.status === 'COMPLETED';
  const deadlineStatus = getDeadlineStatus(task.deadline, isCompleted);

  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks =
    task.subtasks?.filter((s) => s.isCompleted).length || 0;
  const subtaskProgress =
    totalSubtasks > 0
      ? Math.round((completedSubtasks / totalSubtasks) * 100)
      : 0;

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(task._id),
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress(task)}
      style={[
        styles.card,
        isCompleted && styles.completedCard,
        deadlineStatus.isOverdue && !isCompleted && styles.overdueCard,
      ]}
    >
      <View style={styles.contentRow}>
        {/* Checkbox Toggle Button */}
        <TouchableOpacity
          style={[
            styles.checkbox,
            isCompleted && styles.checkedCheckbox,
          ]}
          onPress={() => onToggleStatus(task._id)}
          activeOpacity={0.7}
        >
          {isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        {/* Task Details Area */}
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                isCompleted && styles.completedTitle,
              ]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
            <PriorityBadge priority={task.priority} />
          </View>

          {!!task.description && (
            <Text
              style={[
                styles.description,
                isCompleted && styles.completedDescription,
              ]}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          )}

          {/* Subtasks Micro-Progress Bar */}
          {totalSubtasks > 0 && (
            <View style={styles.subtaskProgressContainer}>
              <View style={styles.subtaskLabelRow}>
                <Text style={styles.subtaskProgressText}>
                  ☑ Checklist ({completedSubtasks}/{totalSubtasks})
                </Text>
                <Text style={styles.subtaskPercentText}>
                  {subtaskProgress}%
                </Text>
              </View>
              <View style={styles.subtaskTrack}>
                <View
                  style={[
                    styles.subtaskFill,
                    {
                      width: `${subtaskProgress}%`,
                      backgroundColor:
                        subtaskProgress === 100
                          ? Colors.completed
                          : Colors.accentLight,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Badges & Meta Row */}
          <View style={styles.metaRow}>
            {/* Deadline Pill */}
            {task.deadline ? (
              <View
                style={[
                  styles.metaBadge,
                  { backgroundColor: deadlineStatus.badgeBg },
                ]}
              >
                <Text
                  style={[
                    styles.metaBadgeText,
                    { color: deadlineStatus.badgeColor },
                  ]}
                >
                  {deadlineStatus.label}
                </Text>
              </View>
            ) : null}

            {/* Quick Snooze Shortcut */}
            {!isCompleted && task.deadline && onSnooze ? (
              <TouchableOpacity
                style={styles.snoozeChip}
                onPress={() => onSnooze(task._id, 3)}
                activeOpacity={0.7}
              >
                <Text style={styles.snoozeText}>+3h</Text>
              </TouchableOpacity>
            ) : null}

            {/* Scheduled Date/Time */}
            {task.taskDateTime ? (
              <View style={styles.scheduleBadge}>
                <Text style={styles.scheduleText}>
                  🕒 {formatDate(task.taskDateTime)} {formatTime(task.taskDateTime)}
                </Text>
              </View>
            ) : null}

            {/* Category Tag */}
            {task.category && task.category !== 'General' ? (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>🏷️ {task.category}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Delete Quick Action */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 2,
  },
  completedCard: {
    opacity: 0.65,
    backgroundColor: '#0F131C',
    borderColor: 'transparent',
  },
  overdueCard: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  checkedCheckbox: {
    backgroundColor: Colors.completed,
    borderColor: Colors.completed,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 4,
    fontSize: 13,
  },
  completedDescription: {
    textDecorationLine: 'line-through',
    color: Colors.textDisabled,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  metaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scheduleBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scheduleText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  categoryBadge: {
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    color: '#93C5FD',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  deleteIcon: {
    fontSize: 12,
    color: Colors.urgent,
    fontWeight: '700',
  },
  subtaskProgressContainer: {
    marginTop: 8,
    backgroundColor: Colors.surfaceLight,
    padding: 8,
    borderRadius: 8,
  },
  subtaskLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subtaskProgressText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  subtaskPercentText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  subtaskTrack: {
    height: 4,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 2,
    overflow: 'hidden',
  },
  subtaskFill: {
    height: '100%',
    borderRadius: 2,
  },
  snoozeChip: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: '#F59E0B',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  snoozeText: {
    fontSize: 11,
    color: '#FBBF24',
    fontWeight: '700',
  },
});
