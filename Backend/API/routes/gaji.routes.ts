import { Router } from 'express';
import {
  getMyGaji,
  getGajiByUserId,
  getAllGaji,
  updateGajiTetap,
  calculateMonthlyPayroll,
  getPayslip,
  getPayslipByUser,
  getPayrollSummary,
} from '../controllers/gaji.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { apiResponse } from '../middlewares/response.middleware';

const router = Router();

router.get('/me', authMiddleware(), apiResponse(getMyGaji));
router.post('/calculate', authMiddleware(['admin']), apiResponse(calculateMonthlyPayroll));
router.get('/summary', authMiddleware(['admin']), apiResponse(getPayrollSummary));
router.get('/payslip/me', authMiddleware(), apiResponse(getPayslip));
router.get('/payslip/:userId', authMiddleware(['manager', 'admin']), apiResponse(getPayslipByUser));
router.get('/:userId', authMiddleware(['manager', 'admin']), apiResponse(getGajiByUserId));
router.get('/', authMiddleware(['manager', 'admin']), apiResponse(getAllGaji));
router.put('/:userId', authMiddleware(['admin']), apiResponse(updateGajiTetap));

export default router;
