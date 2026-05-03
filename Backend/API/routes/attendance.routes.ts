import { Router } from 'express';
import {
	checkoutAttendance,
	getCheckoutQr,
	getCurrentQr,
	scanAttendance,
} from '../controllers/attendance.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { apiResponse } from '../middlewares/response.middleware';

const router = Router();

router.get('/qr', authMiddleware(), apiResponse(getCurrentQr));
router.post('/scan', authMiddleware(), apiResponse(scanAttendance));
router.get('/checkout/qr', authMiddleware(), apiResponse(getCheckoutQr));
router.post('/checkout/scan', authMiddleware(), apiResponse(checkoutAttendance));

export default router;
