import { Router } from 'express';
import {
    createUser,
    resetPassword,
    getProfileId,
    updateProfileById,
} from '../controllers/admin.userManage.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { apiResponse } from '../middlewares/response.middleware';

const router = Router();

router.post('/users', authMiddleware(['admin']), apiResponse(createUser));
router.patch('/users/reset/:id', authMiddleware(['admin']), apiResponse(resetPassword));
router.get('/users/:id', authMiddleware(['admin']), apiResponse(getProfileId));
router.patch('/users/:id', authMiddleware(['admin']), apiResponse(updateProfileById));

export default router;
