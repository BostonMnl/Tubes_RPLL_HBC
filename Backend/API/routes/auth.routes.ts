import { Router } from 'express';
import { 
  login, 
  logout, 
} from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { apiResponse } from '../middlewares/response.middleware';

const router = Router();

router.post('/login', apiResponse(login));
router.post('/logout', authMiddleware(), apiResponse(logout));

export default router;