import bcrypt from 'bcryptjs';
import { ITask } from './Task';

export interface InMemoryUser {
  _id: string;
  name: string;
  email: string;
  password: string; // bcrypt hashed
  createdAt: Date;
}

// In-Memory Storage
export const inMemoryUsers: InMemoryUser[] = [];
export const inMemoryTasks: ITask[] = [];

// Initialize default demo account and sample tasks
export const initInMemoryDemoData = async () => {
  if (inMemoryUsers.length === 0) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const demoUser: InMemoryUser = {
      _id: '65e9b7a0f1234567890abcde',
      name: 'Demo Evaluator',
      email: 'evaluator@example.com',
      password: hashedPassword,
      createdAt: new Date(),
    };
    inMemoryUsers.push(demoUser);

    const now = new Date();
    const mockTasksData: Partial<ITask>[] = [
      {
        _id: 'task_001' as any,
        userId: demoUser._id as any,
        title: '⚠️ Submit Final Quarterly Assignment Report',
        description: 'Complete all sections and export PDF for review',
        priority: 'HIGH',
        status: 'PENDING',
        deadline: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4h Overdue!
        category: 'Work',
        tags: ['report', 'urgent'],
        subtasks: [
          { id: 'sub_1', title: 'Write executive summary', isCompleted: true },
          { id: 'sub_2', title: 'Compile test coverage metrics', isCompleted: false },
          { id: 'sub_3', title: 'Export PDF artifact', isCompleted: false },
        ],
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
      {
        _id: 'task_002' as any,
        userId: demoUser._id as any,
        title: '🚨 Resolve Critical API Latency Spike',
        description: 'Investigate slow database query times on production endpoint',
        priority: 'URGENT',
        status: 'PENDING',
        deadline: new Date(now.getTime() + 2 * 60 * 60 * 1000), // Due in 2h!
        category: 'Work',
        tags: ['backend', 'bug'],
        subtasks: [
          { id: 'sub_4', title: 'Check MongoDB indexes', isCompleted: true },
          { id: 'sub_5', title: 'Profile request pipeline', isCompleted: false },
        ],
        createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      },
      {
        _id: 'task_003' as any,
        userId: demoUser._id as any,
        title: '📱 Test React Native Dark Mode on Android',
        description: 'Verify color contrast and smooth card transitions',
        priority: 'MEDIUM',
        status: 'PENDING',
        deadline: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Due tomorrow
        category: 'Study',
        tags: ['mobile', 'ui'],
        subtasks: [
          { id: 'sub_6', title: 'Audit color contrast ratios', isCompleted: false },
          { id: 'sub_7', title: 'Check touch targets on small screens', isCompleted: false },
        ],
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
      {
        _id: 'task_004' as any,
        userId: demoUser._id as any,
        title: '🌱 Read Clean Code Chapter 4',
        description: 'Best practices for function design and comments',
        priority: 'LOW',
        status: 'PENDING',
        deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Next week
        category: 'Personal',
        tags: ['reading'],
        subtasks: [],
        createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      },
      {
        _id: 'task_005' as any,
        userId: demoUser._id as any,
        title: '✓ Initialize React Native & Express Codebase',
        description: 'Setup project folders, TypeScript types, and Redux slices',
        priority: 'HIGH',
        status: 'COMPLETED',
        completedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        category: 'Work',
        tags: ['setup'],
        subtasks: [
          { id: 'sub_8', title: 'Setup TypeScript config', isCompleted: true },
          { id: 'sub_9', title: 'Setup Redux slices', isCompleted: true },
        ],
        createdAt: new Date(now.getTime() - 72 * 60 * 60 * 1000),
      },
    ];

    mockTasksData.forEach((t) => inMemoryTasks.push(t as ITask));
  }
};
