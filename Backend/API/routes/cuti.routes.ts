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
  getAllCuti,
} from '../controllers/cuti.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { apiResponse } from '../middlewares/response.middleware';

const router = Router();

router.get('/all', authMiddleware([]), apiResponse(getAllCuti));
router.post('/', authMiddleware(['staff', 'manager', 'supervisor', 'admin']), apiResponse(createMyCutiRequest));
router.post('/for-user', authMiddleware([], ['manager', 'supervisor']), apiResponse(createRequestCutiForUser));
router.get('/me', authMiddleware(), apiResponse(getMyCuti));
router.get('/quota', authMiddleware(), apiResponse(getRemainingCutiQuota));
router.get('/:id', authMiddleware([], ['manager', 'supervisor']), apiResponse(getCutiByUserId));
router.get('/', authMiddleware([], ['manager', 'supervisor']), apiResponse(getAllCutiRequests));
router.put('/:id/approval', authMiddleware([], ['manager', 'supervisor']), apiResponse(approveDeclineCutiRequest));
router.delete('/:id', authMiddleware(), apiResponse(deleteMyCutiRequest));

export default router;
