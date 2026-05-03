import { Router } from 'express';
import { promoteUser, getProfileId } from '../controllers/managerial.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { apiResponse } from '../middlewares/response.middleware';

const router = Router();

router.patch('/:id', authMiddleware([], ['supervisor', 'manager']), apiResponse(promoteUser));
router.get('/users/:id', authMiddleware([],['supervisor', 'manager']), apiResponse(getProfileId));
// router.patch('/:id/manager', authMiddleware([], ['supervisor', 'manager']), apiResponse(assignManager));

export default router;
