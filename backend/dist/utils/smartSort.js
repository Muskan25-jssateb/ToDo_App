"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortTasksBySmartMix = exports.calculateUrgencyScore = void 0;
const PRIORITY_WEIGHTS = {
    URGENT: 120,
    HIGH: 80,
    MEDIUM: 40,
    LOW: 15,
};
/**
 * Calculates a dynamic urgency score for a task.
 * Higher score = higher priority in the list.
 */
const calculateUrgencyScore = (task, now = new Date()) => {
    // If task is completed, it belongs at the bottom of the list
    if (task.status === 'COMPLETED') {
        const completedTimestamp = task.completedAt ? new Date(task.completedAt).getTime() : 0;
        // Timestamps in ms are around 1.7e12, so -1e14 ensures score is always deeply negative
        return -100000000000000 + completedTimestamp;
    }
    let score = 0;
    // 1. Base Priority Weight
    const priorityWeight = PRIORITY_WEIGHTS[task.priority] || PRIORITY_WEIGHTS.MEDIUM;
    score += priorityWeight;
    // 2. Deadline Urgency Factor
    if (task.deadline) {
        const deadlineTime = new Date(task.deadline).getTime();
        const currentTime = now.getTime();
        const diffHours = (deadlineTime - currentTime) / (1000 * 60 * 60);
        if (diffHours < 0) {
            // Overdue! Apply severe urgency escalation based on hours overdue
            const hoursOverdue = Math.abs(diffHours);
            score += 300 + Math.min(hoursOverdue * 5, 200); // 300 to 500 bonus
        }
        else if (diffHours <= 6) {
            // Due within next 6 hours: Extremely critical
            score += 250 + (6 - diffHours) * 10;
        }
        else if (diffHours <= 24) {
            // Due within 24 hours: High urgency
            score += 150 + (24 - diffHours) * 4;
        }
        else if (diffHours <= 72) {
            // Due within 3 days: Medium urgency
            score += 70 + (72 - diffHours) * 1.5;
        }
        else {
            // More than 3 days away
            score += Math.max(5, 50 - diffHours * 0.1);
        }
    }
    // 3. Task Scheduled Time Proximity (taskDateTime)
    if (task.taskDateTime) {
        const scheduledTime = new Date(task.taskDateTime).getTime();
        const diffScheduledHours = (scheduledTime - now.getTime()) / (1000 * 60 * 60);
        // If scheduled for today/past, give slight boost
        if (diffScheduledHours <= 0 && diffScheduledHours >= -24) {
            score += 25;
        }
    }
    // 4. Age Factor (Anti-starvation: older pending tasks slowly creep up)
    const createdTime = new Date(task.createdAt || now).getTime();
    const ageHours = (now.getTime() - createdTime) / (1000 * 60 * 60);
    score += Math.min(ageHours * 0.5, 40); // Cap age bonus at 40 points
    return score;
};
exports.calculateUrgencyScore = calculateUrgencyScore;
/**
 * Sorts an array of tasks using the Smart Mix algorithm
 */
const sortTasksBySmartMix = (tasks) => {
    const now = new Date();
    return [...tasks].sort((a, b) => {
        const scoreA = (0, exports.calculateUrgencyScore)(a, now);
        const scoreB = (0, exports.calculateUrgencyScore)(b, now);
        return scoreB - scoreA; // Descending order (highest urgency first)
    });
};
exports.sortTasksBySmartMix = sortTasksBySmartMix;
