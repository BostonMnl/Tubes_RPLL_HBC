import { Router } from 'express';
import {
  createPenalti,
  getMyPenalti,
  getPenalti,
  getAllPenalti,
  getPenaltiByUserId,
  updatePenalti,
  deletePenalti,
} from '../controllers/pinalti.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { apiResponse } from '../middlewares/response.middleware';

const router = Router();

router.post('/', authMiddleware(['admin'], ['manager', 'supervisor']), apiResponse(createPenalti));
router.get('/me', authMiddleware(), apiResponse(getMyPenalti));
router.get('/user/:userId', authMiddleware(['admin'], ['manager', 'supervisor']), apiResponse(getPenaltiByUserId));
router.get('/:id', authMiddleware(), apiResponse(getPenalti));
router.get('/', authMiddleware(['admin']), apiResponse(getAllPenalti));
router.put('/:id', authMiddleware(['admin'], ['manager', 'supervisor']), apiResponse(updatePenalti));
router.delete('/:id', authMiddleware(['admin']), apiResponse(deletePenalti));

export default router;
