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
router.post('/', authMiddleware(['manager', 'admin']), apiResponse(createGaji));
router.get('/:userId', authMiddleware(['manager', 'admin']), apiResponse(getGajiByUserId));
router.get('/', authMiddleware(['manager', 'admin']), apiResponse(getAllGaji));
router.put('/:userId', authMiddleware(['admin']), apiResponse(updateGajiTetap));

export default router;
