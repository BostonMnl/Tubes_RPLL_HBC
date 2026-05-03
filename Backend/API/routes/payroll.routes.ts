import { Router } from 'express';
import {
  createPayroll,
  getMyPayroll,
  getPayrollByUserId,
  getPayrollById,
  getAllPayroll,
  deletePayroll,
} from '../controllers/payroll.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { apiResponse } from '../middlewares/response.middleware';

const router = Router();

router.post('/', authMiddleware(['admin'], ['manager', 'supervisor']), apiResponse(createPayroll));
router.get('/me', authMiddleware(), apiResponse(getMyPayroll));
router.get('/user/:userId', authMiddleware(), apiResponse(getPayrollByUserId));
router.get('/:id', authMiddleware(), apiResponse(getPayrollById));
router.get('/', authMiddleware(['admin'], ['manager', 'supervisor']), apiResponse(getAllPayroll));
router.delete('/:id', authMiddleware(), apiResponse(deletePayroll));

export default router;
