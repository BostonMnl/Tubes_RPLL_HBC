import { Router } from 'express';
import {
    createUser,
    resetPassword,
    getProfileId,
    updateProfileById,
    getUsersProfile,
} from '../controllers/admin.userManage.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { apiResponse } from '../middlewares/response.middleware';
import { uploadProduct } from '../utils/uploadUtils';

const router = Router();

router.get('/users', authMiddleware(['admin']), apiResponse(getUsersProfile));
router.post('/users', authMiddleware(['admin']), uploadProduct.single('gambar'), apiResponse(createUser));
router.patch('/users/reset/:id', authMiddleware(['admin']), apiResponse(resetPassword));
router.get('/users/:id', authMiddleware(['admin']), apiResponse(getProfileId));
router.patch('/users/:id', authMiddleware(['admin']), uploadProduct.single('gambar'), apiResponse(updateProfileById));

export default router;
