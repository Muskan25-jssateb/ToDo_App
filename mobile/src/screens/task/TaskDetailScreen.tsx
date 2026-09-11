import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleTaskStatus, deleteTask, updateTask } from '../../store/slices/taskSlice';
import { PriorityBadge } from '../../components/PriorityBadge';
import { CustomButton } from '../../components/CustomButton';
import { FocusTimerModal } from '../../components/FocusTimerModal';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { formatDateTime, getDeadlineStatus } from '../../utils/dateUtils';
import { streakUtils } from '../../utils/streakUtils';

type Props = NativeStackScreenProps<MainStackParamList, 'TaskDetail'>;

export const TaskDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const dispatch = useAppDispatch();
  const initialTask = route.params.task;
  const [isFocusTimerVisible, setIsFocusTimerVisible] = useState(false);

  // Track latest task from Redux state
  const task = useAppSelector(
    (state) => state.tasks.tasks.find((t) => t._id === initialTask._id) || initialTask
  );

  const isCompleted = task.status === 'COMPLETED';
  const deadlineStatus = getDeadlineStatus(task.deadline, isCompleted);

  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks =
    task.subtasks?.filter((s) => s.isCompleted).length || 0;
  const subtaskProgress =
    totalSubtasks > 0
      ? Math.round((completedSubtasks / totalSubtasks) * 100)
      : 0;

  const handleToggle = async () => {
    await dispatch(toggleTaskStatus(task._id));
    if (!isCompleted) {
      await streakUtils.recordCompletion();
    }
  };

  const handleToggleSubtask = (subtaskId: string) => {
    if (!task.subtasks) return;
    const updatedSubtasks = task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
    );
    dispatch(
      updateTask({
        id: task._id,
        payload: { subtasks: updatedSubtasks },
      })
    );
  };

  const handleSnooze = (hours: number) => {
    const base = task.deadline ? new Date(task.deadline) : new Date();
    const newDeadline = new Date(base.getTime() + hours * 60 * 60 * 1000);
    dispatch(
      updateTask({
        id: task._id,
        payload: { deadline: newDeadline.toISOString() },
      })
    );
    Alert.alert('Task Snoozed', `Deadline extended by ${hours} hours.`);
  };

  const handleSnoozeTomorrowMorning = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    dispatch(
      updateTask({
        id: task._id,
        payload: { deadline: d.toISOString() },
      })
    );
    Alert.alert('Task Rescheduled', 'Deadline moved to Tomorrow at 9:00 AM.');
  };

  const handleDelete = () => {
    Alert.alert('Delete Task', 'Are you sure you want to permanently delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await dispatch(deleteTask(task._id));
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('AddEditTask', { task })}
          >
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Status Badge */}
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                isCompleted ? styles.completedBadge : styles.pendingBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isCompleted ? styles.completedStatusText : styles.pendingStatusText,
                ]}
              >
                {isCompleted ? '✓ COMPLETED' : '⏳ PENDING'}
              </Text>
            </View>
            <PriorityBadge priority={task.priority} />
          </View>

          {/* Title */}
          <Text style={[styles.title, isCompleted && styles.completedTitle]}>
            {task.title}
          </Text>

          {/* Description */}
          {task.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Description</Text>
              <Text style={styles.descriptionText}>{task.description}</Text>
            </View>
          ) : null}

          {/* Focus Mode Pomodoro Action */}
          {!isCompleted && (
            <TouchableOpacity
              style={styles.focusModeButton}
              onPress={() => setIsFocusTimerVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.focusModeIcon}>⏱️</Text>
              <View style={styles.focusModeTextWrap}>
                <Text style={styles.focusModeTitle}>Start Focus Session</Text>
                <Text style={styles.focusModeSubtitle}>
                  25-minute distraction-free Pomodoro session
                </Text>
              </View>
              <Text style={styles.focusModeArrow}>→</Text>
            </TouchableOpacity>
          )}

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            {/* Deadline */}
            <View style={styles.detailCard}>
              <Text style={styles.detailIcon}>🚨</Text>
              <Text style={styles.detailLabel}>Deadline</Text>
              <Text style={styles.detailValue}>
                {task.deadline ? formatDateTime(task.deadline) : 'None'}
              </Text>
              {task.deadline && (
                <Text
                  style={[
                    styles.deadlineSubtext,
                    { color: deadlineStatus.badgeColor },
                  ]}
                >
                  {deadlineStatus.label}
                </Text>
              )}
            </View>

            {/* Scheduled */}
            <View style={styles.detailCard}>
              <Text style={styles.detailIcon}>🕒</Text>
              <Text style={styles.detailLabel}>Scheduled</Text>
              <Text style={styles.detailValue}>
                {task.taskDateTime ? formatDateTime(task.taskDateTime) : 'Unscheduled'}
              </Text>
            </View>

            {/* Category */}
            <View style={styles.detailCard}>
              <Text style={styles.detailIcon}>🏷️</Text>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{task.category || 'General'}</Text>
            </View>

            {/* Created At */}
            <View style={styles.detailCard}>
              <Text style={styles.detailIcon}>📅</Text>
              <Text style={styles.detailLabel}>Created</Text>
              <Text style={styles.detailValue}>
                {formatDateTime(task.createdAt)}
              </Text>
            </View>
          </View>

          {/* 1-Tap Quick Snooze Options (if pending) */}
          {!isCompleted && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Quick Reschedule / Snooze</Text>
              <View style={styles.snoozeRow}>
                <TouchableOpacity
                  style={styles.snoozeButton}
                  onPress={() => handleSnooze(3)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.snoozeButtonText}>⏰ +3 Hours</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.snoozeButton}
                  onPress={handleSnoozeTomorrowMorning}
                  activeOpacity={0.7}
                >
                  <Text style={styles.snoozeButtonText}>📅 Tomorrow 9AM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.snoozeButton}
                  onPress={() => handleSnooze(24 * 7)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.snoozeButtonText}>🗓️ Next Week</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Subtasks Checklist */}
          {totalSubtasks > 0 && (
            <View style={styles.section}>
              <View style={styles.subtaskHeaderRow}>
                <Text style={styles.sectionLabel}>
                  Checklist ({completedSubtasks}/{totalSubtasks})
                </Text>
                <Text style={styles.subtaskProgressPct}>{subtaskProgress}%</Text>
              </View>

              {/* Progress track */}
              <View style={styles.detailSubtaskTrack}>
                <View
                  style={[
                    styles.detailSubtaskFill,
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

              {/* Subtask list items */}
              <View style={styles.subtasksList}>
                {task.subtasks!.map((sub) => (
                  <TouchableOpacity
                    key={sub.id}
                    style={styles.subtaskRow}
                    onPress={() => handleToggleSubtask(sub.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.subtaskCheckbox,
                        sub.isCompleted && styles.subtaskCheckboxChecked,
                      ]}
                    >
                      {sub.isCompleted && (
                        <Text style={styles.subtaskCheckmark}>✓</Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.subtaskTitleText,
                        sub.isCompleted && styles.subtaskTitleTextCompleted,
                      ]}
                    >
                      {sub.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Tags</Text>
              <View style={styles.tagWrap}>
                {task.tags.map((tag, idx) => (
                  <View key={idx} style={styles.tagPill}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <CustomButton
              title={isCompleted ? 'Mark as Incomplete' : 'Mark as Completed'}
              onPress={handleToggle}
              variant={isCompleted ? 'secondary' : 'primary'}
              style={styles.toggleButton}
            />

            <CustomButton
              title="Delete Task"
              onPress={handleDelete}
              variant="danger"
              style={styles.deleteButton}
            />
          </View>
        </ScrollView>

        {/* Focus Mode Pomodoro Modal */}
        <FocusTimerModal
          visible={isFocusTimerVisible}
          task={task}
          onClose={() => setIsFocusTimerVisible(false)}
          onCompleteTask={async (taskId) => {
            await dispatch(toggleTaskStatus(taskId));
            await streakUtils.recordCompletion();
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 6,
  },
  backIcon: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    padding: 6,
  },
  editText: {
    color: Colors.primaryLight,
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  completedBadge: {
    backgroundColor: Colors.completedMuted,
    borderColor: Colors.completed,
  },
  pendingBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: Colors.pending,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  completedStatusText: {
    color: Colors.completed,
  },
  pendingStatusText: {
    color: Colors.pending,
  },
  title: {
    ...Typography.h1,
    marginBottom: 16,
    lineHeight: 34,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  descriptionText: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    lineHeight: 24,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  detailCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    width: '48%',
  },
  detailIcon: {
    fontSize: 18,
    marginBottom: 6,
  },
  detailLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  deadlineSubtext: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  actionContainer: {
    marginTop: 20,
    gap: 12,
  },
  toggleButton: {
    marginBottom: 4,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.urgent,
  },
  focusModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  focusModeIcon: {
    fontSize: 26,
  },
  focusModeTextWrap: {
    flex: 1,
  },
  focusModeTitle: {
    ...Typography.bodyLarge,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  focusModeSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  focusModeArrow: {
    fontSize: 20,
    color: Colors.accentLight,
    fontWeight: '700',
  },
  snoozeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  snoozeButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  snoozeButtonText: {
    fontSize: 12,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  subtaskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subtaskProgressPct: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.accentLight,
  },
  detailSubtaskTrack: {
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  detailSubtaskFill: {
    height: '100%',
    borderRadius: 3,
  },
  subtasksList: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 6,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  subtaskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subtaskCheckboxChecked: {
    backgroundColor: Colors.completed,
    borderColor: Colors.completed,
  },
  subtaskCheckmark: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  subtaskTitleText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  subtaskTitleTextCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
});
