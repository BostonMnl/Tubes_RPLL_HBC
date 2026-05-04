import { Router } from 'express';
import { 
  createPenalti,
  getMyPenalti, 
  getPenaltiById, 
  getAllPenalti, 
  getPenaltiByUserId, 
  updatePenalti, 
  deletePenalti 
} from '../controllers/pinalti.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { apiResponse } from '../middlewares/response.middleware';
import { uploadImage } from '../utils/uploadUtils';

const router = Router();

router.post('/', authMiddleware([], ['manager', 'supervisor']), uploadImage.single('gambar'), apiResponse(createPenalti));
router.get('/me', authMiddleware(), apiResponse(getMyPenalti));
router.get('/user/:userId', authMiddleware([], ['manager', 'supervisor']), apiResponse(getPenaltiByUserId));
router.get('/:id', authMiddleware(), apiResponse(getPenaltiById));
router.get('/', authMiddleware(), apiResponse(getAllPenalti));
router.put('/:id', authMiddleware([], ['manager', 'supervisor']), uploadImage.single('gambar'), apiResponse(updatePenalti));
router.delete('/:id', authMiddleware(['admin']), apiResponse(deletePenalti));

export default router;