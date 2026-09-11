import apiClient from './client';
import {
  Task,
  TaskStats,
  CreateTaskPayload,
  UpdateTaskPayload,
  SortOption,
  StatusFilterOption,
  PriorityLevel,
} from '../types';

export interface GetTasksParams {
  status?: StatusFilterOption;
  priority?: PriorityLevel | 'ALL';
  category?: string;
  search?: string;
  sortBy?: SortOption;
}

export interface GetTasksResponse {
  success: boolean;
  count: number;
  stats: TaskStats;
  tasks: Task[];
}

export interface SingleTaskResponse {
  success: boolean;
  message: string;
  task: Task;
}

export const taskApi = {
  /**
   * Fetch all tasks with optional filters, search, and sorting
   */
  getTasks: async (params: GetTasksParams = {}): Promise<GetTasksResponse> => {
    const queryParams: Record<string, string> = {};

    if (params.status && params.status !== 'ALL') {
      queryParams.status = params.status;
    }
    if (params.priority && params.priority !== 'ALL') {
      queryParams.priority = params.priority;
    }
    if (params.category && params.category !== 'ALL') {
      queryParams.category = params.category;
    }
    if (params.search && params.search.trim()) {
      queryParams.search = params.search.trim();
    }
    if (params.sortBy) {
      queryParams.sortBy = params.sortBy;
    }

    const response = await apiClient.get<GetTasksResponse>('/tasks', {
      params: queryParams,
    });
    return response.data;
  },

  /**
   * Create a new task
   */
  createTask: async (payload: CreateTaskPayload): Promise<SingleTaskResponse> => {
    const response = await apiClient.post<SingleTaskResponse>('/tasks', payload);
    return response.data;
  },

  /**
   * Update an existing task
   */
  updateTask: async (
    id: string,
    payload: UpdateTaskPayload
  ): Promise<SingleTaskResponse> => {
    const response = await apiClient.put<SingleTaskResponse>(`/tasks/${id}`, payload);
    return response.data;
  },

  /**
   * Toggle completion status of a task
   */
  toggleTaskStatus: async (id: string): Promise<SingleTaskResponse> => {
    const response = await apiClient.patch<SingleTaskResponse>(`/tasks/${id}/toggle`);
    return response.data;
  },

  /**
   * Permanently delete a task
   */
  deleteTask: async (id: string): Promise<{ success: boolean; taskId: string }> => {
    const response = await apiClient.delete<{ success: boolean; taskId: string }>(
      `/tasks/${id}`
    );
    return response.data;
  },
};
