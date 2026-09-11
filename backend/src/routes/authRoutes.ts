import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getProfile);

export default router;
