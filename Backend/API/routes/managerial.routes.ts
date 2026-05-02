import { Router } from 'express';
import { assignManager, promoteUser } from '../controllers/managerial.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { apiResponse } from '../middlewares/response.middleware';

const router = Router();

router.patch('/:id', authMiddleware([], ['supervisor', 'manager']), apiResponse(promoteUser));
router.patch('/:id/manager', authMiddleware([], ['supervisor', 'manager']), apiResponse(assignManager));
export default router;
