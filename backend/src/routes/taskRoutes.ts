import { Router } from 'express';
import {
  getTasks,
  createTask,
  updateTask,
  toggleTaskStatus,
  deleteTask,
} from '../controllers/taskController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// All task routes require authentication
router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .put(updateTask)
  .delete(deleteTask);

router.patch('/:id/toggle', toggleTaskStatus);

export default router;
