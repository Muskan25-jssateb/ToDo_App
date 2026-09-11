"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSmartSortVerification = void 0;
const smartSort_1 = require("./smartSort");
const createMockTask = (overrides) => {
    return {
        _id: 'mock_id_' + Math.random(),
        title: 'Test Task',
        priority: 'MEDIUM',
        status: 'PENDING',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
};
const runSmartSortVerification = () => {
    console.log('--- Testing Smart Mix Urgency Algorithm ---');
    const now = new Date();
    // Task 1: Low priority, due in 10 days
    const taskLowFuture = createMockTask({
        title: 'Low Priority Future Task',
        priority: 'LOW',
        deadline: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
    });
    // Task 2: High priority, due in 48 hours
    const taskHighMedium = createMockTask({
        title: 'High Priority 2-Day Task',
        priority: 'HIGH',
        deadline: new Date(now.getTime() + 48 * 60 * 60 * 1000),
    });
    // Task 3: Medium priority, due in 2 hours (Imminent!)
    const taskImminent = createMockTask({
        title: 'Medium Priority Imminent Task (2h left)',
        priority: 'MEDIUM',
        deadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
    });
    // Task 4: Low priority, but Overdue by 5 hours!
    const taskOverdue = createMockTask({
        title: 'Overdue Task (5h overdue)',
        priority: 'LOW',
        deadline: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    });
    // Task 5: Completed task (should be at the very bottom)
    const taskCompleted = createMockTask({
        title: 'Completed Task',
        priority: 'URGENT',
        status: 'COMPLETED',
        completedAt: new Date(),
    });
    const rawList = [
        taskLowFuture,
        taskHighMedium,
        taskCompleted,
        taskImminent,
        taskOverdue,
    ];
    const sortedList = (0, smartSort_1.sortTasksBySmartMix)(rawList);
    console.log('\nResults after Smart Mix Sort:');
    sortedList.forEach((task, index) => {
        const score = (0, smartSort_1.calculateUrgencyScore)(task, now);
        console.log(`${index + 1}. [Score: ${score.toFixed(1)}] ${task.title} (Priority: ${task.priority}, Status: ${task.status})`);
    });
    // Validations
    // 1. Overdue task or imminent task should be at the top
    const topTask = sortedList[0];
    if (topTask.title !== taskOverdue.title && topTask.title !== taskImminent.title) {
        throw new Error(`Expected overdue or imminent task to be ranked #1, got: ${topTask.title}`);
    }
    // 2. Completed task must be at the very bottom
    const bottomTask = sortedList[sortedList.length - 1];
    if (bottomTask.title !== taskCompleted.title) {
        throw new Error(`Expected completed task to be ranked last, got: ${bottomTask.title}`);
    }
    console.log('\n✅ Smart Mix Urgency Algorithm verification passed successfully!\n');
};
exports.runSmartSortVerification = runSmartSortVerification;
(0, exports.runSmartSortVerification)();
