import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TaskState,
  Task,
  TaskStats,
  CreateTaskPayload,
  UpdateTaskPayload,
  StatusFilterOption,
  PriorityLevel,
  SortOption,
} from '../../types';
import { taskApi } from '../../api/taskApi';
import { logoutUser, registerUser, loginUser } from './authSlice';

export const SEED_TASKS: Task[] = [
  {
    _id: 'task_1789110623273',
    userId: 'user_1789110490184',
    title: 'record',
    description: 'Prepare and record project demonstration walkthrough',
    taskDateTime: undefined,
    deadline: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
    priority: 'URGENT',
    category: 'Study',
    tags: ['#study', '#urgent'],
    subtasks: [
      { id: 'sub_1', title: 'Outline talking points', isCompleted: true },
      { id: 'sub_2', title: 'Capture screen recording', isCompleted: false },
    ],
    status: 'PENDING',
    createdAt: '2026-09-11T07:10:23.273Z',
    updatedAt: '2026-09-11T07:10:23.273Z',
  },
  {
    _id: 'task_1789110647505',
    userId: 'user_1789110490184',
    title: 'project diary',
    description: 'Document architecture, design decisions, and smart sorting logic',
    taskDateTime: undefined,
    deadline: new Date(Date.now() + 14 * 3600 * 1000).toISOString(),
    priority: 'URGENT',
    category: 'Study',
    tags: ['#study'],
    subtasks: [
      { id: 'sub_3', title: 'Write intro and requirements', isCompleted: true },
      { id: 'sub_4', title: 'Add diagrams and screenshots', isCompleted: true },
    ],
    status: 'PENDING',
    createdAt: '2026-09-11T07:10:47.505Z',
    updatedAt: '2026-09-11T07:10:47.505Z',
  },
  {
    _id: 'task_1789110590636',
    userId: 'user_1789110490184',
    title: 'exams',
    description: 'Review modules 3 and 4 for upcoming tests',
    taskDateTime: undefined,
    deadline: new Date(Date.now() + 3 * 86400 * 1000).toISOString(),
    priority: 'HIGH',
    category: 'Study',
    tags: ['#study', '#exams'],
    subtasks: [],
    status: 'PENDING',
    createdAt: '2026-09-11T07:09:50.636Z',
    updatedAt: '2026-09-11T07:09:50.636Z',
  },
  {
    _id: 'task_1789110558979',
    userId: 'user_1789110490184',
    title: 'haircut',
    description: 'Appointment at salon',
    taskDateTime: undefined,
    deadline: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
    priority: 'LOW',
    category: 'Personal',
    tags: ['#personal'],
    subtasks: [],
    status: 'PENDING',
    createdAt: '2026-09-11T07:09:18.979Z',
    updatedAt: '2026-09-11T07:09:18.979Z',
  },
  {
    _id: 'task_1789110534805',
    userId: 'user_1789110490184',
    title: 'medicine',
    description: 'Take evening vitamins and prescriptions',
    taskDateTime: undefined,
    deadline: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    priority: 'HIGH',
    category: 'Health',
    tags: ['#health'],
    subtasks: [],
    status: 'COMPLETED',
    createdAt: '2026-09-11T07:08:54.805Z',
    updatedAt: '2026-09-11T07:11:00.184Z',
    completedAt: '2026-09-11T07:11:00.184Z',
  },
];

export const calculateStats = (tasks: Task[]): TaskStats => {
  const now = new Date();
  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'COMPLETED').length,
    pending: tasks.filter((t) => t.status === 'PENDING').length,
    overdue: tasks.filter(
      (t) => t.status === 'PENDING' && t.deadline && new Date(t.deadline) < now
    ).length,
    urgent: tasks.filter((t) => t.status === 'PENDING' && t.priority === 'URGENT').length,
  };
};

const getUserTasksKey = (userId?: string): string => {
  return userId ? `@todo_app_cached_tasks_${userId}` : '@todo_app_cached_tasks_default';
};

const getLocalTasks = async (userId?: string): Promise<Task[]> => {
  const key = getUserTasksKey(userId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (_) {}

  // If this is specifically the original pre-seeded account, return default tasks
  if (userId === 'user_1789110490184') {
    await AsyncStorage.setItem(key, JSON.stringify(SEED_TASKS));
    return SEED_TASKS;
  }

  // Any new account begins with ZERO tasks
  await AsyncStorage.setItem(key, JSON.stringify([]));
  return [];
};

const saveLocalTasks = async (userId: string | undefined, tasks: Task[]) => {
  try {
    const key = getUserTasksKey(userId);
    await AsyncStorage.setItem(key, JSON.stringify(tasks));
  } catch (_) {}
};

const filterAndSortLocalTasks = (
  allTasks: Task[],
  filters: {
    status: StatusFilterOption;
    priority: PriorityLevel | 'ALL';
    category: string;
    search: string;
    sortBy: SortOption;
  }
): Task[] => {
  let filtered = [...allTasks];

  if (filters.status && filters.status !== 'ALL') {
    filtered = filtered.filter((t) => t.status === filters.status);
  }
  if (filters.priority && filters.priority !== 'ALL') {
    filtered = filtered.filter((t) => t.priority === filters.priority);
  }
  if (filters.category && filters.category !== 'ALL') {
    filtered = filtered.filter(
      (t) => t.category?.toLowerCase() === filters.category.toLowerCase()
    );
  }
  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  }

  // Sorting
  filtered.sort((a, b) => {
    if (filters.sortBy === 'deadline') {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (filters.sortBy === 'priority') {
      const weights: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (weights[b.priority] || 0) - (weights[a.priority] || 0);
    }
    if (filters.sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    // Smart mix
    const priorityWeight: Record<string, number> = {
      URGENT: 120,
      HIGH: 80,
      MEDIUM: 40,
      LOW: 15,
    };
    const scoreTask = (task: Task) => {
      if (task.status === 'COMPLETED') return -1000;
      let score = priorityWeight[task.priority] || 20;
      if (task.deadline) {
        const diffHours =
          (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
        if (diffHours < 0) score += 400;
        else if (diffHours < 6) score += 280;
        else if (diffHours < 24) score += 180;
        else if (diffHours < 72) score += 80;
      }
      return score;
    };
    return scoreTask(b) - scoreTask(a);
  });

  return filtered;
};

const initialStats: TaskStats = {
  total: 0,
  completed: 0,
  pending: 0,
  overdue: 0,
  urgent: 0,
};

const initialState: TaskState = {
  tasks: [],
  stats: initialStats,
  statusFilter: 'ALL',
  priorityFilter: 'ALL',
  categoryFilter: 'ALL',
  searchQuery: '',
  sortBy: 'smart',
  isLoading: false,
  isSubmitting: false,
  error: null,
};

// Async Thunks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, { getState }) => {
    const rootState = getState() as {
      tasks: TaskState;
      auth: { user: { id: string } | null };
    };
    const state = rootState.tasks;
    const userId = rootState.auth.user?.id;

    try {
      const response = await taskApi.getTasks({
        status: state.statusFilter,
        priority: state.priorityFilter,
        category: state.categoryFilter,
        search: state.searchQuery,
        sortBy: state.sortBy,
      });
      await saveLocalTasks(userId, response.tasks);
      return response;
    } catch (_) {
      // Offline fallback: strictly scoped to the logged-in user
      const local = await getLocalTasks(userId);
      const filtered = filterAndSortLocalTasks(local, {
        status: state.statusFilter,
        priority: state.priorityFilter,
        category: state.categoryFilter,
        search: state.searchQuery,
        sortBy: state.sortBy,
      });
      return {
        success: true,
        count: filtered.length,
        stats: calculateStats(local),
        tasks: filtered,
      };
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (payload: CreateTaskPayload, { dispatch, getState }) => {
    const rootState = getState() as {
      tasks: TaskState;
      auth: { user: { id: string } | null };
    };
    const userId = rootState.auth.user?.id || 'user_' + Date.now();

    try {
      const response = await taskApi.createTask(payload);
      dispatch(fetchTasks());
      return response.task;
    } catch (_) {
      // Offline fallback: save to this specific user's store
      const local = await getLocalTasks(userId);
      const newTask: Task = {
        _id: 'task_' + Date.now(),
        userId: userId,
        title: payload.title,
        description: payload.description || '',
        taskDateTime: payload.taskDateTime || undefined,
        deadline: payload.deadline || undefined,
        priority: payload.priority,
        category: payload.category || 'General',
        tags: payload.tags || [],
        subtasks: payload.subtasks || [],
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      local.unshift(newTask);
      await saveLocalTasks(userId, local);
      dispatch(fetchTasks());
      return newTask;
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async (
    { id, payload }: { id: string; payload: UpdateTaskPayload },
    { dispatch, getState }
  ) => {
    const rootState = getState() as {
      tasks: TaskState;
      auth: { user: { id: string } | null };
    };
    const userId = rootState.auth.user?.id;

    try {
      const response = await taskApi.updateTask(id, payload);
      dispatch(fetchTasks());
      return response.task;
    } catch (_) {
      const local = await getLocalTasks(userId);
      const index = local.findIndex((t) => t._id === id);
      if (index !== -1) {
        local[index] = {
          ...local[index],
          ...payload,
          updatedAt: new Date().toISOString(),
        };
        await saveLocalTasks(userId, local);
      }
      dispatch(fetchTasks());
      return local[index];
    }
  }
);

export const toggleTaskStatus = createAsyncThunk(
  'tasks/toggleTaskStatus',
  async (id: string, { dispatch, getState }) => {
    const rootState = getState() as {
      tasks: TaskState;
      auth: { user: { id: string } | null };
    };
    const userId = rootState.auth.user?.id;

    try {
      const response = await taskApi.toggleTaskStatus(id);
      dispatch(fetchTasks());
      return response.task;
    } catch (_) {
      const local = await getLocalTasks(userId);
      const target = local.find((t) => t._id === id);
      if (target) {
        target.status = target.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        if (target.status === 'COMPLETED') {
          target.completedAt = new Date().toISOString();
        } else {
          target.completedAt = undefined;
        }
        target.updatedAt = new Date().toISOString();
        await saveLocalTasks(userId, local);
      }
      dispatch(fetchTasks());
      return target;
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id: string, { dispatch, getState }) => {
    const rootState = getState() as {
      tasks: TaskState;
      auth: { user: { id: string } | null };
    };
    const userId = rootState.auth.user?.id;

    try {
      await taskApi.deleteTask(id);
      dispatch(fetchTasks());
      return id;
    } catch (_) {
      const local = await getLocalTasks(userId);
      const filtered = local.filter((t) => t._id !== id);
      await saveLocalTasks(userId, filtered);
      dispatch(fetchTasks());
      return id;
    }
  }
);

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setStatusFilter: (state, action: PayloadAction<StatusFilterOption>) => {
      state.statusFilter = action.payload;
    },
    setPriorityFilter: (state, action: PayloadAction<PriorityLevel | 'ALL'>) => {
      state.priorityFilter = action.payload;
    },
    setCategoryFilter: (state, action: PayloadAction<string>) => {
      state.categoryFilter = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSortBy: (state, action: PayloadAction<SortOption>) => {
      state.sortBy = action.payload;
    },
    clearTaskError: (state) => {
      state.error = null;
    },
    resetTasksState: (state) => {
      state.tasks = [];
      state.stats = initialStats;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Reset tasks on logout, registration, or login
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.tasks = [];
      state.stats = initialStats;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state) => {
      state.tasks = [];
      state.stats = initialStats;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state) => {
      state.tasks = [];
      state.stats = initialStats;
      state.error = null;
    });

    // Fetch Tasks
    builder.addCase(fetchTasks.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchTasks.fulfilled, (state, action) => {
      state.isLoading = false;
      state.tasks = action.payload.tasks;
      state.stats = action.payload.stats;
    });
    builder.addCase(fetchTasks.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Create Task
    builder.addCase(createTask.pending, (state) => {
      state.isSubmitting = true;
      state.error = null;
    });
    builder.addCase(createTask.fulfilled, (state) => {
      state.isSubmitting = false;
    });
    builder.addCase(createTask.rejected, (state, action) => {
      state.isSubmitting = false;
      state.error = action.payload as string;
    });

    // Update Task
    builder.addCase(updateTask.pending, (state) => {
      state.isSubmitting = true;
    });
    builder.addCase(updateTask.fulfilled, (state) => {
      state.isSubmitting = false;
    });
    builder.addCase(updateTask.rejected, (state, action) => {
      state.isSubmitting = false;
      state.error = action.payload as string;
    });

    // Optimistic toggle
    builder.addCase(toggleTaskStatus.pending, (state, action) => {
      const taskId = action.meta.arg;
      const target = state.tasks.find((t) => t._id === taskId);
      if (target) {
        target.status = target.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      }
    });

    // Optimistic delete
    builder.addCase(deleteTask.pending, (state, action) => {
      const taskId = action.meta.arg;
      state.tasks = state.tasks.filter((t) => t._id !== taskId);
    });
  },
});

export const {
  setStatusFilter,
  setPriorityFilter,
  setCategoryFilter,
  setSearchQuery,
  setSortBy,
  clearTaskError,
  resetTasksState,
} = taskSlice.actions;

export default taskSlice.reducer;
