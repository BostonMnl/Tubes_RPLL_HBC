import { Router } from 'express';
import {
  getAllAttendance,
  patchAttendance,
} from '../controllers/attendanceManage.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { apiResponse } from '../middlewares/response.middleware';

const router = Router();

router.get('/', authMiddleware([], ['supervisor', 'manager']), apiResponse(getAllAttendance));
router.patch('/:id', authMiddleware(['admin']), apiResponse(patchAttendance));

export default router;
