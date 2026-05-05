import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { apiResponse } from '../middlewares/response.middleware';
import {
	getMyActivityLogs,
	getUsersActivityLogsByDate,
} from '../controllers/activityLog.controller';

const router = Router();

router.get('/me', authMiddleware(), apiResponse(getMyActivityLogs));
router.get('/users', authMiddleware(['admin']), apiResponse(getUsersActivityLogsByDate));

export default router;
