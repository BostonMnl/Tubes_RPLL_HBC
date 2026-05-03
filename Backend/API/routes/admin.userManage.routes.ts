import { Router } from 'express';
import {
    createUser,
    resetPassword,
    getProfileId,
    updateProfileById,
    getAllUsers,
    deleteUser,
} from '../controllers/admin.userManage.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { apiResponse } from '../middlewares/response.middleware';
import { uploadImage } from '../utils/uploadUtils';

const router = Router();

router.get('/users', authMiddleware(), apiResponse(getAllUsers));
router.post('/users', authMiddleware(['admin']), uploadImage.single('gambar'), apiResponse(createUser));
router.patch('/users/reset/:id', authMiddleware(['admin']), apiResponse(resetPassword));
router.patch('/users/:id', authMiddleware(['admin']), uploadImage.single('gambar'), apiResponse(updateProfileById));
router.delete('/users/:id', authMiddleware(['admin']), apiResponse(deleteUser));

export default router;
