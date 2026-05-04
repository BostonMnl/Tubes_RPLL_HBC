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
router.post('/', authMiddleware([], ['manager', 'supervisor']), apiResponse(createGaji));
router.get('/', authMiddleware([], ['manager', 'supervisor']), apiResponse(getAllGaji));
router.get('/:userId', authMiddleware([], ['manager', 'supervisor']), apiResponse(getGajiByUserId));
router.put('/:userId', authMiddleware([], ['manager', 'supervisor']), apiResponse(updateGajiTetap));

export default router;
