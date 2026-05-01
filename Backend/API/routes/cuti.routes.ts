import { Router } from 'express';
import {
  createMyCutiRequest,
  createRequestCutiForUser,
  getMyCuti,
  getCutiByUserId,
  getAllCutiRequests,
  approveDeclineCutiRequest,
  getRemainingCutiQuota,
  deleteMyCutiRequest,
} from '../controllers/cuti.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { apiResponse } from '../middlewares/response.middleware';

const router = Router();

router.post('/', authMiddleware(['staff', 'manager', 'admin']), apiResponse(createMyCutiRequest));
router.post('/for-user', authMiddleware(['manager', 'admin']), apiResponse(createRequestCutiForUser));
router.get('/me', authMiddleware(), apiResponse(getMyCuti));
router.get('/quota', authMiddleware(), apiResponse(getRemainingCutiQuota));
router.get('/:id', authMiddleware(['manager', 'admin']), apiResponse(getCutiByUserId));
router.get('/', authMiddleware(['manager', 'admin']), apiResponse(getAllCutiRequests));
router.put('/:id/approval', authMiddleware(['manager', 'admin']), apiResponse(approveDeclineCutiRequest));
router.delete('/:id', authMiddleware(), apiResponse(deleteMyCutiRequest));

export default router;
