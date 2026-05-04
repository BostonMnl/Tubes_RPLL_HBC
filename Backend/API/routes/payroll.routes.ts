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

router.post('/', authMiddleware([], ['manager', 'supervisor', 'admin']), apiResponse(createPayroll));
router.get('/me', authMiddleware(), apiResponse(getMyPayroll));
router.get('/user/:userId', authMiddleware(), apiResponse(getPayrollByUserId));
router.get('/:id', authMiddleware(), apiResponse(getPayrollById));
router.get('/', authMiddleware([], ['manager', 'supervisor', 'admin']), apiResponse(getAllPayroll));
router.delete('/:id', authMiddleware(), apiResponse(deletePayroll));

export default router;
