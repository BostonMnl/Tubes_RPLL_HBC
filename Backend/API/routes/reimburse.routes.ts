import { Router } from 'express';
import {
  createMyReimburseRequest,
  createReimburseRequestForUser,
  getMyReimburse,
  getReimburseById,
  getAllReimburseRequests,
  updateReimburseRequest,
  approveDeclineReimburseRequest,
  deleteReimburseRequest,
  getAllReimburseHistory,
} from '../controllers/reimburse.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { apiResponse } from '../middlewares/response.middleware';
import { uploadImage} from '../utils/uploadUtils';

const router = Router();

router.post('/', authMiddleware(['staff', 'manager', 'supervisor', 'admin']), uploadImage.single('gambar'), apiResponse(createMyReimburseRequest));
router.post('/for-user', authMiddleware([], ['manager', 'supervisor']), uploadImage.single('gambar'), apiResponse(createReimburseRequestForUser));
router.get('/me', authMiddleware(), apiResponse(getMyReimburse));
router.get('/', authMiddleware([], ['manager', 'supervisor']), apiResponse(getAllReimburseRequests));
router.get('/:id', authMiddleware(), apiResponse(getReimburseById));
router.put('/:id', authMiddleware(), uploadImage.single('gambar'), apiResponse(updateReimburseRequest));
router.put('/:id/approval', authMiddleware([], ['manager', 'supervisor']), apiResponse(approveDeclineReimburseRequest));
router.delete('/:id', authMiddleware(), apiResponse(deleteReimburseRequest));
router.get('/history/all', authMiddleware(['admin']), apiResponse(getAllReimburseHistory));

export default router;
