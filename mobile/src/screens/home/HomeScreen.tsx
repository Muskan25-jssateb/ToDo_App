import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import {
  fetchTasks,
  createTask,
  updateTask,
  toggleTaskStatus,
  deleteTask,
  setStatusFilter,
  setPriorityFilter,
  setSortBy,
  setSearchQuery,
} from '../../store/slices/taskSlice';
import { Task, StatusFilterOption, PriorityLevel, SortOption } from '../../types';
import { TaskCard } from '../../components/TaskCard';
import { StatCard } from '../../components/StatCard';
import { FilterPill } from '../../components/FilterPill';
import { QuickAddBar } from '../../components/QuickAddBar';
import { CelebrationCard } from '../../components/CelebrationCard';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { streakUtils } from '../../utils/streakUtils';
import { shareDailyBriefing } from '../../utils/exportUtils';

type Props = NativeStackScreenProps<MainStackParamList, 'Home'>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const {
    tasks,
    stats,
    isLoading,
    isSubmitting,
    statusFilter,
    priorityFilter,
    sortBy,
    searchQuery,
  } = useAppSelector((state) => state.tasks);

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [streakCount, setStreakCount] = useState(1);

  // Load streak on mount
  useEffect(() => {
    streakUtils.getStreak().then(setStreakCount);
  }, []);

  // Initial load
  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch, statusFilter, priorityFilter, sortBy, searchQuery]);

  // Debounce search update
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setSearchQuery(localSearch));
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch, dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(fetchTasks());
    streakUtils.getStreak().then(setStreakCount);
  }, [dispatch]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => dispatch(logoutUser()),
      },
    ]);
  };

  const handleToggleStatus = async (id: string) => {
    const target = tasks.find((t) => t._id === id);
    const willBeCompleted = target?.status === 'PENDING';
    await dispatch(toggleTaskStatus(id));

    if (willBeCompleted) {
      const updatedStreak = await streakUtils.recordCompletion();
      setStreakCount(updatedStreak);
    }
  };

  const handleSnoozeTask = (id: string, hours: number) => {
    const target = tasks.find((t) => t._id === id);
    if (!target) return;
    const base = target.deadline ? new Date(target.deadline) : new Date();
    const newDeadline = new Date(base.getTime() + hours * 60 * 60 * 1000);
    dispatch(
      updateTask({
        id,
        payload: { deadline: newDeadline.toISOString() },
      })
    );
    Alert.alert('Task Snoozed', `Deadline extended by ${hours} hours.`);
  };

  const handleQuickAdd = async (payload: {
    title: string;
    priority: PriorityLevel;
    category: string;
    deadline?: string;
    tags: string[];
  }) => {
    await dispatch(createTask(payload)).unwrap();
  };

  const handleShare = () => {
    shareDailyBriefing(tasks, stats, user?.name);
  };

  const handleDeleteTask = (id: string) => {
    dispatch(deleteTask(id));
  };

  const handleTaskPress = (task: Task) => {
    navigation.navigate('TaskDetail', { task });
  };

  // Calculate completion percentage
  const completionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <View>
            <View style={styles.greetingRow}>
              <Text style={styles.greetingText}>
                Hello, {user?.name?.split(' ')[0] || 'There'} 👋
              </Text>
              <View style={styles.headerStreakBadge}>
                <Text style={styles.headerStreakText}>🔥 {streakCount}d</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              {stats.pending > 0
                ? `You have ${stats.pending} pending task${stats.pending > 1 ? 's' : ''}`
                : 'All caught up! Great job.'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Text style={styles.headerActionIcon}>📋</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Text style={styles.logoutIcon}>🚪</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dashboard Progress & Metrics Cards */}
        <View style={styles.statsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsScroll}
          >
            <StatCard
              label="Completed"
              value={stats.completed}
              icon="✅"
              color={Colors.completed}
            />
            <StatCard
              label="Pending"
              value={stats.pending}
              icon="⏳"
              color={Colors.primaryLight}
            />
            <StatCard
              label="Urgent"
              value={stats.urgent}
              icon="⚡"
              color={Colors.urgent}
            />
            <StatCard
              label="Overdue"
              value={stats.overdue}
              icon="⚠️"
              color={Colors.urgent}
            />
          </ScrollView>

          {/* Progress Bar */}
          <View style={styles.progressBarWrapper}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Daily Progress</Text>
              <Text style={styles.progressPercent}>{completionRate}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${completionRate}%` }]}
              />
            </View>
          </View>
        </View>

        {/* NLP Smart Quick Add Bar */}
        <QuickAddBar onAddTask={handleQuickAdd} isLoading={isSubmitting} />

        {/* Inbox Zero Celebration Card */}
        {stats.total > 0 && stats.pending === 0 && (
          <CelebrationCard
            completedCount={stats.completed}
            streakCount={streakCount}
          />
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search tasks, descriptions, tags..."
            placeholderTextColor={Colors.textDisabled}
            value={localSearch}
            onChangeText={setLocalSearch}
            style={styles.searchInput}
          />
          {localSearch.length > 0 && (
            <TouchableOpacity onPress={() => setLocalSearch('')}>
              <Text style={styles.clearSearchIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter & Sort Chips */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {/* Status filters */}
            {(['ALL', 'PENDING', 'COMPLETED'] as StatusFilterOption[]).map((status) => (
              <FilterPill
                key={status}
                label={status === 'ALL' ? 'All Tasks' : status}
                isActive={statusFilter === status}
                onPress={() => dispatch(setStatusFilter(status))}
              />
            ))}

            {/* Smart Mix Algorithm toggle */}
            <FilterPill
              label="🧠 Smart Mix"
              isActive={sortBy === 'smart'}
              onPress={() => dispatch(setSortBy('smart'))}
            />

            {/* Deadline Sort */}
            <FilterPill
              label="⏰ Deadline"
              isActive={sortBy === 'deadline'}
              onPress={() => dispatch(setSortBy('deadline'))}
            />

            {/* Priority Sort */}
            <FilterPill
              label="🔥 Priority"
              isActive={sortBy === 'priority'}
              onPress={() => dispatch(setSortBy('priority'))}
            />

            {/* Priority specific filter */}
            {(['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as PriorityLevel[]).map((p) => (
              <FilterPill
                key={p}
                label={p}
                isActive={priorityFilter === p}
                onPress={() =>
                  dispatch(setPriorityFilter(priorityFilter === p ? 'ALL' : p))
                }
              />
            ))}
          </ScrollView>
        </View>

        {/* Task List */}
        <FlatList
          data={tasks}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteTask}
              onPress={handleTaskPress}
              onSnooze={handleSnoozeTask}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
              tintColor={Colors.primaryLight}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matching tasks found' : 'No tasks yet!'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try adjusting your search terms or filters.'
                  : 'Tap the + button below to create your first task with priority and deadline tracking.'}
              </Text>
            </View>
          }
        />

        {/* Floating Add Task Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddEditTask', {})}
          activeOpacity={0.85}
        >
          <Text style={styles.fabPlus}>＋</Text>
          <Text style={styles.fabLabel}>Create Task</Text>
        </TouchableOpacity>
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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greetingText: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  headerStreakBadge: {
    backgroundColor: 'rgba(234, 88, 12, 0.2)',
    borderColor: '#F97316',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  headerStreakText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FDBA74',
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionIcon: {
    fontSize: 18,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    fontSize: 18,
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statsScroll: {
    paddingBottom: 12,
  },
  progressBarWrapper: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  progressPercent: {
    ...Typography.caption,
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearSearchIcon: {
    color: Colors.textMuted,
    fontSize: 14,
    padding: 4,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterScroll: {
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 90,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    ...Typography.h3,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
    color: Colors.textMuted,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  fabPlus: {
    fontSize: 18,
    color: Colors.white,
    fontWeight: '700',
    marginRight: 6,
  },
  fabLabel: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
