"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.toggleTaskStatus = exports.updateTask = exports.createTask = exports.getTasks = void 0;
const Task_1 = require("../models/Task");
const smartSort_1 = require("../utils/smartSort");
const db_1 = require("../config/db");
const inMemoryStore_1 = require("../models/inMemoryStore");
/**
 * @route   GET /api/tasks
 * @desc    Get all tasks for current authenticated user with filtering, search, and sorting
 * @access  Private
 */
const getTasks = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { status, priority, category, search, sortBy = 'smart' } = req.query;
        let tasks = [];
        // Fallback if MongoDB is offline
        if ((0, db_1.isInMemoryMode)()) {
            tasks = inMemoryStore_1.inMemoryTasks.filter((t) => t.userId.toString() === userId.toString());
            if (status && (status === 'PENDING' || status === 'COMPLETED')) {
                tasks = tasks.filter((t) => t.status === status);
            }
            if (priority && ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) {
                tasks = tasks.filter((t) => t.priority === priority);
            }
            if (category && category !== 'ALL') {
                tasks = tasks.filter((t) => t.category === category);
            }
            if (search && typeof search === 'string' && search.trim() !== '') {
                const q = search.trim().toLowerCase();
                tasks = tasks.filter((t) => t.title.toLowerCase().includes(q) ||
                    (t.description && t.description.toLowerCase().includes(q)) ||
                    (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q))));
            }
            // Sort
            if (sortBy === 'smart') {
                tasks = (0, smartSort_1.sortTasksBySmartMix)(tasks);
            }
            else if (sortBy === 'deadline') {
                tasks.sort((a, b) => {
                    if (a.status !== b.status)
                        return a.status === 'PENDING' ? -1 : 1;
                    if (!a.deadline)
                        return 1;
                    if (!b.deadline)
                        return -1;
                    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                });
            }
            else if (sortBy === 'priority') {
                const rank = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
                tasks.sort((a, b) => {
                    if (a.status !== b.status)
                        return a.status === 'PENDING' ? -1 : 1;
                    return (rank[b.priority] || 0) - (rank[a.priority] || 0);
                });
            }
            else {
                tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            }
            const allUserTasks = inMemoryStore_1.inMemoryTasks.filter((t) => t.userId.toString() === userId.toString());
            const now = new Date();
            const stats = {
                total: allUserTasks.length,
                completed: allUserTasks.filter((t) => t.status === 'COMPLETED').length,
                pending: allUserTasks.filter((t) => t.status === 'PENDING').length,
                overdue: allUserTasks.filter((t) => t.status === 'PENDING' && t.deadline && new Date(t.deadline) < now).length,
                urgent: allUserTasks.filter((t) => t.status === 'PENDING' && t.priority === 'URGENT').length,
            };
            res.status(200).json({
                success: true,
                count: tasks.length,
                stats,
                tasks,
            });
            return;
        }
        // Real MongoDB implementation
        const query = { userId };
        if (status && (status === 'PENDING' || status === 'COMPLETED')) {
            query.status = status;
        }
        if (priority && ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) {
            query.priority = priority;
        }
        if (category && category !== 'ALL') {
            query.category = category;
        }
        if (search && typeof search === 'string' && search.trim() !== '') {
            query.$or = [
                { title: { $regex: search.trim(), $options: 'i' } },
                { description: { $regex: search.trim(), $options: 'i' } },
                { tags: { $in: [new RegExp(search.trim(), 'i')] } },
            ];
        }
        tasks = await Task_1.Task.find(query);
        // Apply Sorting Method
        if (sortBy === 'smart') {
            tasks = (0, smartSort_1.sortTasksBySmartMix)(tasks);
        }
        else if (sortBy === 'deadline') {
            tasks.sort((a, b) => {
                if (a.status !== b.status)
                    return a.status === 'PENDING' ? -1 : 1;
                if (!a.deadline)
                    return 1;
                if (!b.deadline)
                    return -1;
                return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
            });
        }
        else if (sortBy === 'priority') {
            const rank = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
            tasks.sort((a, b) => {
                if (a.status !== b.status)
                    return a.status === 'PENDING' ? -1 : 1;
                return (rank[b.priority] || 0) - (rank[a.priority] || 0);
            });
        }
        else {
            tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        const allUserTasks = await Task_1.Task.find({ userId });
        const now = new Date();
        const stats = {
            total: allUserTasks.length,
            completed: allUserTasks.filter((t) => t.status === 'COMPLETED').length,
            pending: allUserTasks.filter((t) => t.status === 'PENDING').length,
            overdue: allUserTasks.filter((t) => t.status === 'PENDING' && t.deadline && new Date(t.deadline) < now).length,
            urgent: allUserTasks.filter((t) => t.status === 'PENDING' && t.priority === 'URGENT').length,
        };
        res.status(200).json({
            success: true,
            count: tasks.length,
            stats,
            tasks,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTasks = getTasks;
/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private
 */
const createTask = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { title, description, taskDateTime, deadline, priority = 'MEDIUM', category = 'General', tags = [], subtasks = [], } = req.body;
        if (!title || title.trim() === '') {
            res.status(400).json({
                success: false,
                message: 'Task title is required.',
            });
            return;
        }
        if ((0, db_1.isInMemoryMode)()) {
            const newTask = {
                _id: 'task_' + Date.now(),
                userId,
                title: title.trim(),
                description: description ? description.trim() : '',
                taskDateTime: taskDateTime ? new Date(taskDateTime) : null,
                deadline: deadline ? new Date(deadline) : null,
                priority,
                category,
                tags: Array.isArray(tags) ? tags : [],
                subtasks: Array.isArray(subtasks) ? subtasks : [],
                status: 'PENDING',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            inMemoryStore_1.inMemoryTasks.unshift(newTask);
            res.status(201).json({
                success: true,
                message: 'Task created successfully.',
                task: newTask,
            });
            return;
        }
        const task = await Task_1.Task.create({
            userId,
            title: title.trim(),
            description: description ? description.trim() : '',
            taskDateTime: taskDateTime ? new Date(taskDateTime) : null,
            deadline: deadline ? new Date(deadline) : null,
            priority,
            category,
            tags: Array.isArray(tags) ? tags : [],
            subtasks: Array.isArray(subtasks) ? subtasks : [],
            status: 'PENDING',
        });
        res.status(201).json({
            success: true,
            message: 'Task created successfully.',
            task,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createTask = createTask;
/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task details
 * @access  Private
 */
const updateTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const { title, description, taskDateTime, deadline, priority, status, category, tags, subtasks, } = req.body;
        if ((0, db_1.isInMemoryMode)()) {
            const task = inMemoryStore_1.inMemoryTasks.find((t) => t._id.toString() === id && t.userId.toString() === userId);
            if (!task) {
                res.status(404).json({ success: false, message: 'Task not found or unauthorized.' });
                return;
            }
            if (title !== undefined)
                task.title = title.trim();
            if (description !== undefined)
                task.description = description.trim();
            if (taskDateTime !== undefined)
                task.taskDateTime = taskDateTime ? new Date(taskDateTime) : undefined;
            if (deadline !== undefined)
                task.deadline = deadline ? new Date(deadline) : undefined;
            if (priority !== undefined)
                task.priority = priority;
            if (category !== undefined)
                task.category = category;
            if (tags !== undefined)
                task.tags = Array.isArray(tags) ? tags : task.tags;
            if (subtasks !== undefined)
                task.subtasks = Array.isArray(subtasks) ? subtasks : task.subtasks;
            if (status !== undefined && status !== task.status) {
                task.status = status;
                task.completedAt = status === 'COMPLETED' ? new Date() : undefined;
            }
            task.updatedAt = new Date();
            res.status(200).json({ success: true, message: 'Task updated successfully.', task });
            return;
        }
        const task = await Task_1.Task.findOne({ _id: id, userId });
        if (!task) {
            res.status(404).json({
                success: false,
                message: 'Task not found or unauthorized.',
            });
            return;
        }
        if (title !== undefined)
            task.title = title.trim();
        if (description !== undefined)
            task.description = description.trim();
        if (taskDateTime !== undefined)
            task.taskDateTime = taskDateTime ? new Date(taskDateTime) : undefined;
        if (deadline !== undefined)
            task.deadline = deadline ? new Date(deadline) : undefined;
        if (priority !== undefined)
            task.priority = priority;
        if (category !== undefined)
            task.category = category;
        if (tags !== undefined)
            task.tags = Array.isArray(tags) ? tags : task.tags;
        if (subtasks !== undefined)
            task.subtasks = Array.isArray(subtasks) ? subtasks : task.subtasks;
        if (status !== undefined && status !== task.status) {
            task.status = status;
            task.completedAt = status === 'COMPLETED' ? new Date() : undefined;
        }
        await task.save();
        res.status(200).json({
            success: true,
            message: 'Task updated successfully.',
            task,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTask = updateTask;
/**
 * @route   PATCH /api/tasks/:id/toggle
 * @desc    Toggle task status between PENDING and COMPLETED
 * @access  Private
 */
const toggleTaskStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if ((0, db_1.isInMemoryMode)()) {
            const task = inMemoryStore_1.inMemoryTasks.find((t) => t._id.toString() === id && t.userId.toString() === userId);
            if (!task) {
                res.status(404).json({ success: false, message: 'Task not found or unauthorized.' });
                return;
            }
            const isDone = task.status === 'COMPLETED';
            task.status = isDone ? 'PENDING' : 'COMPLETED';
            task.completedAt = isDone ? undefined : new Date();
            task.updatedAt = new Date();
            res.status(200).json({ success: true, message: `Task marked as ${task.status.toLowerCase()}.`, task });
            return;
        }
        const task = await Task_1.Task.findOne({ _id: id, userId });
        if (!task) {
            res.status(404).json({
                success: false,
                message: 'Task not found or unauthorized.',
            });
            return;
        }
        const isCurrentlyCompleted = task.status === 'COMPLETED';
        task.status = isCurrentlyCompleted ? 'PENDING' : 'COMPLETED';
        task.completedAt = isCurrentlyCompleted ? undefined : new Date();
        await task.save();
        res.status(200).json({
            success: true,
            message: `Task marked as ${task.status.toLowerCase()}.`,
            task,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.toggleTaskStatus = toggleTaskStatus;
/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task
 * @access  Private
 */
const deleteTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        if ((0, db_1.isInMemoryMode)()) {
            const idx = inMemoryStore_1.inMemoryTasks.findIndex((t) => t._id.toString() === id && t.userId.toString() === userId);
            if (idx === -1) {
                res.status(404).json({ success: false, message: 'Task not found or unauthorized.' });
                return;
            }
            inMemoryStore_1.inMemoryTasks.splice(idx, 1);
            res.status(200).json({ success: true, message: 'Task deleted successfully.', taskId: id });
            return;
        }
        const task = await Task_1.Task.findOneAndDelete({ _id: id, userId });
        if (!task) {
            res.status(404).json({
                success: false,
                message: 'Task not found or unauthorized.',
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Task deleted successfully.',
            taskId: id,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTask = deleteTask;
