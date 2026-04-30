import { Router } from 'express';
import { promoteUser } from '../controllers/promotion.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { apiResponse } from '../middlewares/response.middleware';

const router = Router();

router.patch('/:id', authMiddleware([], ['supervisor', 'manager']), apiResponse(promoteUser));
export default router;
