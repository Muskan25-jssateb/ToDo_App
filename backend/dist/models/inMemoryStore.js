"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initInMemoryDemoData = exports.inMemoryTasks = exports.inMemoryUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// In-Memory Storage
exports.inMemoryUsers = [];
exports.inMemoryTasks = [];
// Initialize default demo account and sample tasks
const initInMemoryDemoData = async () => {
    if (exports.inMemoryUsers.length === 0) {
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash('password123', salt);
        const demoUser = {
            _id: '65e9b7a0f1234567890abcde',
            name: 'Demo Evaluator',
            email: 'evaluator@example.com',
            password: hashedPassword,
            createdAt: new Date(),
        };
        exports.inMemoryUsers.push(demoUser);
        const now = new Date();
        const mockTasksData = [
            {
                _id: 'task_001',
                userId: demoUser._id,
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
                _id: 'task_002',
                userId: demoUser._id,
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
                _id: 'task_003',
                userId: demoUser._id,
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
                _id: 'task_004',
                userId: demoUser._id,
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
                _id: 'task_005',
                userId: demoUser._id,
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
        mockTasksData.forEach((t) => exports.inMemoryTasks.push(t));
    }
};
exports.initInMemoryDemoData = initInMemoryDemoData;
