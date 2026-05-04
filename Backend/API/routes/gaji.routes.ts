import { Router } from 'express';
import {
  createGaji,
  getMyGaji,
  getGajiByUserId,
  getAllGaji,
  updateGajiTetap,
} from '../controllers/gaji.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { apiResponse } from '../middlewares/response.middleware';

const router = Router();

router.get('/me', authMiddleware(), apiResponse(getMyGaji));
router.post('/', authMiddleware([], ['manager', 'supervisor', 'admin']), apiResponse(createGaji));
router.get('/:userId', authMiddleware([], ['manager', 'supervisor', 'admin']), apiResponse(getGajiByUserId));
router.get('/', authMiddleware([], ['manager', 'supervisor', 'admin']), apiResponse(getAllGaji));
router.put('/:userId', authMiddleware([], ['manager', 'supervisor', 'admin']), apiResponse(updateGajiTetap));

export default router;
