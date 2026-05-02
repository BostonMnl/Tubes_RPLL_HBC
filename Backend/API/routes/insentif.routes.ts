import { Router } from 'express';
import {
  createInsentif,
  getMyInsentif,
  getInsentifById,
  getAllInsentif,
  editInsentif,
  deleteInsentif,
} from '../controllers/insentif.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { apiResponse } from '../middlewares/response.middleware';

const router = Router();

router.post('/', authMiddleware(['manager', 'admin']), apiResponse(createInsentif));
router.get('/me', authMiddleware(), apiResponse(getMyInsentif));
router.get('/:id', authMiddleware(), apiResponse(getInsentifById));
router.get('/', authMiddleware(['manager', 'admin']), apiResponse(getAllInsentif));
router.put('/:id', authMiddleware(['manager', 'admin']), apiResponse(editInsentif));
router.delete('/:id', authMiddleware(['admin']), apiResponse(deleteInsentif));

export default router;
