import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
	// forgotPassword,
	getMyProfile,
	// resetPassword,
	updateMyProfile,
} from '../controllers/user.controller';

const router = Router();

// router.post('/forgot-password', forgotPassword);
// router.post('/reset-password', resetPassword);

router.get('/me', authMiddleware, getMyProfile);
router.patch('/me', authMiddleware, updateMyProfile);

export default router;
