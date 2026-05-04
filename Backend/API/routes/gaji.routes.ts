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
router.post('/', authMiddleware(['admin'], ['manager', 'supervisor']), apiResponse(createGaji));
router.get('/:userId', authMiddleware(['admin'], ['manager', 'supervisor']), apiResponse(getGajiByUserId));
router.get('/', authMiddleware(['admin'], ['manager', 'supervisor']), apiResponse(getAllGaji));
router.put('/:userId', authMiddleware(['admin'], ['manager', 'supervisor']), apiResponse(updateGajiTetap));

export default router;
