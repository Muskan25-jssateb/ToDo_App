export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'COMPLETED';
export type SortOption = 'smart' | 'deadline' | 'priority' | 'newest';
export type StatusFilterOption = 'ALL' | 'PENDING' | 'COMPLETED';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  taskDateTime?: string; // ISO date string
  deadline?: string;     // ISO date string
  priority: PriorityLevel;
  status: TaskStatus;
  category?: string;
  tags: string[];
  subtasks?: Subtask[];  // Nested checklist
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  urgent: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRestoringToken: boolean;
  error: string | null;
}

export interface TaskState {
  tasks: Task[];
  stats: TaskStats;
  statusFilter: StatusFilterOption;
  priorityFilter: PriorityLevel | 'ALL';
  categoryFilter: string;
  searchQuery: string;
  sortBy: SortOption;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  taskDateTime?: string;
  deadline?: string;
  priority: PriorityLevel;
  category?: string;
  tags?: string[];
  subtasks?: Subtask[];
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {
  status?: TaskStatus;
}
