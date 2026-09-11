"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskController_1 = require("../controllers/taskController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// All task routes require authentication
router.use(authMiddleware_1.protect);
router.route('/')
    .get(taskController_1.getTasks)
    .post(taskController_1.createTask);
router.route('/:id')
    .put(taskController_1.updateTask)
    .delete(taskController_1.deleteTask);
router.patch('/:id/toggle', taskController_1.toggleTaskStatus);
exports.default = router;
