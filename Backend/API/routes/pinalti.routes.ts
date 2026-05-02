import { Router } from 'express';
import {
  createPenalti,
  getPenalti,
  getAllPenalti,
  updatePenalti,
  deletePenalti,
} from '../controllers/pinalti.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { apiResponse } from '../middlewares/response.middleware';

const router = Router();

router.post('/', authMiddleware(['admin', 'manager']), apiResponse(createPenalti));
router.get('/:id', authMiddleware(), apiResponse(getPenalti));
router.get('/', authMiddleware(['admin', 'manager']), apiResponse(getAllPenalti));
router.put('/:id', authMiddleware(['admin', 'manager']), apiResponse(updatePenalti));
router.delete('/:id', authMiddleware(['admin']), apiResponse(deletePenalti));

export default router;
