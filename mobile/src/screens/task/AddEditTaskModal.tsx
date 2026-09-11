import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DateTimePickerModal } from '../../components/DateTimePickerModal';
import { MainStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../store';
import { createTask, updateTask } from '../../store/slices/taskSlice';
import { PriorityLevel } from '../../types';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { formatDateTime } from '../../utils/dateUtils';

type Props = NativeStackScreenProps<MainStackParamList, 'AddEditTask'>;

const CATEGORIES = ['General', 'Work', 'Personal', 'Study', 'Health', 'Finance'];
const PRIORITIES: { level: PriorityLevel; label: string; icon: string; color: string }[] = [
  { level: 'LOW', label: 'Low', icon: '🌱', color: Colors.low },
  { level: 'MEDIUM', label: 'Medium', icon: '⚡', color: Colors.medium },
  { level: 'HIGH', label: 'High', icon: '🔥', color: Colors.high },
  { level: 'URGENT', label: 'Urgent', icon: '🚨', color: Colors.urgent },
];

export const AddEditTaskModal: React.FC<Props> = ({ route, navigation }) => {
  const dispatch = useAppDispatch();
  const { isSubmitting, error } = useAppSelector((state) => state.tasks);

  const existingTask = route.params?.task;
  const isEditing = !!existingTask;

  const [title, setTitle] = useState(existingTask?.title || '');
  const [description, setDescription] = useState(existingTask?.description || '');
  const [priority, setPriority] = useState<PriorityLevel>(existingTask?.priority || 'MEDIUM');
  const [category, setCategory] = useState(existingTask?.category || 'General');
  const [tagInput, setTagInput] = useState(existingTask?.tags?.join(', ') || '');
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; isCompleted: boolean }[]>(
    existingTask?.subtasks || []
  );
  const [newSubtaskText, setNewSubtaskText] = useState('');

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      { id: 'sub_' + Date.now(), title: newSubtaskText.trim(), isCompleted: false },
    ]);
    setNewSubtaskText('');
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  // Scheduled date & Deadline
  const [taskDateTime, setTaskDateTime] = useState<Date | null>(
    existingTask?.taskDateTime ? new Date(existingTask.taskDateTime) : null
  );
  const [deadline, setDeadline] = useState<Date | null>(
    existingTask?.deadline ? new Date(existingTask.deadline) : null
  );

  // DateTimePicker state
  const [activePickerTarget, setActivePickerTarget] = useState<'schedule' | 'deadline' | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const [titleError, setTitleError] = useState<string | null>(null);

  const handleOpenPicker = (target: 'schedule' | 'deadline') => {
    setActivePickerTarget(target);
    setShowPicker(true);
  };

  // Quick preset shortcuts for deadline
  const setQuickDeadline = (hoursFromNow: number) => {
    const d = new Date();
    d.setTime(d.getTime() + hoursFromNow * 60 * 60 * 1000);
    setDeadline(d);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setTitleError('Task title is required');
      return;
    }

    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      priority,
      category,
      tags,
      subtasks,
      taskDateTime: taskDateTime ? taskDateTime.toISOString() : undefined,
      deadline: deadline ? deadline.toISOString() : undefined,
    };

    try {
      if (isEditing && existingTask) {
        await dispatch(updateTask({ id: existingTask._id, payload })).unwrap();
      } else {
        await dispatch(createTask(payload)).unwrap();
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to save task');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Modal Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Task' : 'New Task'}
          </Text>
          <TouchableOpacity
            style={styles.saveHeaderButton}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <Text style={styles.saveHeaderText}>
              {isEditing ? 'Save' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Server error */}
          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {/* Title */}
          <CustomInput
            label="Task Title *"
            placeholder="e.g. Complete React Native assignment"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (titleError) setTitleError(null);
            }}
            error={titleError}
          />

          {/* Description */}
          <CustomInput
            label="Description"
            placeholder="Add any notes, subtasks, or context..."
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />

          {/* Priority Selector */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>Priority Level</Text>
            <View style={styles.priorityGrid}>
              {PRIORITIES.map((p) => {
                const isSelected = priority === p.level;
                return (
                  <TouchableOpacity
                    key={p.level}
                    style={[
                      styles.priorityOption,
                      isSelected && {
                        backgroundColor: `${p.color}25`,
                        borderColor: p.color,
                      },
                    ]}
                    onPress={() => setPriority(p.level)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.priorityIcon}>{p.icon}</Text>
                    <Text
                      style={[
                        styles.priorityText,
                        isSelected && { color: p.color, fontWeight: '700' },
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Deadline Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Cutoff Deadline 🚨</Text>
              {deadline && (
                <TouchableOpacity onPress={() => setDeadline(null)}>
                  <Text style={styles.clearDateText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Quick shortcuts */}
            <View style={styles.quickShortcutsRow}>
              <TouchableOpacity
                style={styles.shortcutChip}
                onPress={() => setQuickDeadline(3)}
              >
                <Text style={styles.shortcutText}>+3 Hours</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shortcutChip}
                onPress={() => setQuickDeadline(24)}
              >
                <Text style={styles.shortcutText}>Tomorrow</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shortcutChip}
                onPress={() => setQuickDeadline(72)}
              >
                <Text style={styles.shortcutText}>In 3 Days</Text>
              </TouchableOpacity>
            </View>

            {/* Pickers */}
            <View style={styles.datePickerRow}>
              <TouchableOpacity
                style={styles.dateDisplayButton}
                onPress={() => handleOpenPicker('deadline')}
              >
                <Text style={styles.dateDisplayText}>
                  📅 {deadline ? formatDateTime(deadline.toISOString()) : 'Set Deadline'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Scheduled Date/Time Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Scheduled Time 🕒</Text>
              {taskDateTime && (
                <TouchableOpacity onPress={() => setTaskDateTime(null)}>
                  <Text style={styles.clearDateText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.dateDisplayButton}
              onPress={() => handleOpenPicker('schedule')}
            >
              <Text style={styles.dateDisplayText}>
                🕒 {taskDateTime ? formatDateTime(taskDateTime.toISOString()) : 'Schedule Date & Time'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Category Selector */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    category === cat && styles.activeCategoryChip,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      category === cat && styles.activeCategoryChipText,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Subtasks Checklist Builder */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>
                Subtasks / Checklist ({subtasks.length})
              </Text>
            </View>

            <View style={styles.subtaskInputRow}>
              <TextInput
                placeholder="Add a step (e.g. 'Write unit tests')..."
                placeholderTextColor={Colors.textDisabled}
                value={newSubtaskText}
                onChangeText={setNewSubtaskText}
                onSubmitEditing={handleAddSubtask}
                returnKeyType="done"
                style={styles.subtaskTextInput}
              />
              <TouchableOpacity
                style={styles.addSubtaskButton}
                onPress={handleAddSubtask}
                activeOpacity={0.7}
              >
                <Text style={styles.addSubtaskIcon}>＋ Add</Text>
              </TouchableOpacity>
            </View>

            {subtasks.map((sub, index) => (
              <View key={sub.id || index} style={styles.subtaskItemRow}>
                <Text style={styles.subtaskBullet}>•</Text>
                <Text style={styles.subtaskItemText}>{sub.title}</Text>
                <TouchableOpacity
                  onPress={() => handleDeleteSubtask(sub.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.deleteSubtaskText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Tags */}
          <CustomInput
            label="Tags (comma separated)"
            placeholder="e.g. mobile, urgent, frontend"
            value={tagInput}
            onChangeText={setTagInput}
          />

          {/* Submit Action */}
          <CustomButton
            title={isEditing ? 'Save Changes' : 'Create Task'}
            onPress={handleSave}
            isLoading={isSubmitting}
            style={styles.submitButton}
          />
        </ScrollView>

        {/* Custom Crash-Free In-App Calendar & Time Picker Modal */}
        <DateTimePickerModal
          visible={showPicker}
          title={activePickerTarget === 'deadline' ? 'Set Cutoff Deadline 🚨' : 'Set Scheduled Time 🕒'}
          initialDate={activePickerTarget === 'deadline' ? deadline : taskDateTime}
          onConfirm={(selectedDate) => {
            if (activePickerTarget === 'schedule') {
              setTaskDateTime(selectedDate);
            } else if (activePickerTarget === 'deadline') {
              setDeadline(selectedDate);
            }
          }}
          onClose={() => setShowPicker(false)}
        />
      </KeyboardAvoidingView>
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
  backText: {
    color: Colors.textMuted,
    fontSize: 15,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  saveHeaderButton: {
    padding: 6,
  },
  saveHeaderText: {
    color: Colors.primaryLight,
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  errorBanner: {
    backgroundColor: Colors.urgentMuted,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.urgent,
  },
  errorBannerText: {
    color: Colors.urgent,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearDateText: {
    color: Colors.urgent,
    fontSize: 12,
    fontWeight: '600',
  },
  priorityGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  priorityIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  priorityText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  quickShortcutsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  shortcutChip: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shortcutText: {
    color: Colors.primaryLight,
    fontSize: 11,
    fontWeight: '600',
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateDisplayButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  dateDisplayText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryScroll: {
    gap: 8,
  },
  categoryChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeCategoryChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryChipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  activeCategoryChipText: {
    color: Colors.white,
    fontWeight: '700',
  },
  submitButton: {
    marginTop: 16,
  },
  subtaskInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  subtaskTextInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13.5,
    paddingVertical: 10,
  },
  addSubtaskButton: {
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  addSubtaskIcon: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
  },
  subtaskItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  subtaskBullet: {
    color: Colors.accentLight,
    fontSize: 16,
    marginRight: 8,
    fontWeight: '900',
  },
  subtaskItemText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  deleteSubtaskText: {
    color: Colors.urgent,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
});
