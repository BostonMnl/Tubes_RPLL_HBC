import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
	forgotPassword,
	getMyProfile,
	resetPasswordWithToken,
	updateMyProfile,
} from '../controllers/user.controller';
import { apiResponse } from '../middlewares/response.middleware';

const router = Router();

router.post('/forgot-password', apiResponse(forgotPassword));
router.post('/reset-password', apiResponse(resetPasswordWithToken));
router.get('/me', authMiddleware(), apiResponse(getMyProfile));
router.patch('/me', authMiddleware(), apiResponse(updateMyProfile));

export default router;
