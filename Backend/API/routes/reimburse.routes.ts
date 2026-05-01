import { Router } from 'express';
import {
  createMyReimburseRequest,
  createReimburseRequestForUser,
  getMyReimburse,
  getReimburseById,
  getAllReimburseRequests,
  approveDeclineReimburseRequest,
  deleteReimburseRequest,
  getAllReimburseHistory,
} from '../controllers/reimburse.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { apiResponse } from '../middlewares/response.middleware';

const router = Router();

router.post('/', authMiddleware(['staff', 'manager', 'admin']), apiResponse(createMyReimburseRequest));
router.post('/for-user', authMiddleware(['manager', 'admin']), apiResponse(createReimburseRequestForUser));
router.get('/me', authMiddleware(), apiResponse(getMyReimburse));
router.get('/:id', authMiddleware(), apiResponse(getReimburseById));
router.get('/', authMiddleware(['manager', 'admin']), apiResponse(getAllReimburseRequests));
router.put('/:id/approval', authMiddleware(['manager', 'admin']), apiResponse(approveDeclineReimburseRequest));
router.delete('/:id', authMiddleware(), apiResponse(deleteReimburseRequest));
router.get('/history/all', authMiddleware(['admin']), apiResponse(getAllReimburseHistory));

export default router;
