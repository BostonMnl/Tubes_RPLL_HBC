import { Router } from 'express';
import {
  createInsentif,
  getMyInsentif,
  getInsentifById,
  getAllInsentif,
  editInsentif,
  deleteInsentif,
} from '../controllers/insentif.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { apiResponse } from '../middlewares/response.middleware';
import { uploadImage} from '../utils/uploadUtils';

const router = Router();

router.post('/', authMiddleware([], ['manager', 'supervisor']), uploadImage.single('gambar'), apiResponse(createInsentif));
router.get('/me', authMiddleware(), apiResponse(getMyInsentif));
router.get('/:id', authMiddleware(), apiResponse(getInsentifById));
router.get('/', authMiddleware([], ['manager', 'supervisor']), apiResponse(getAllInsentif));
router.put('/:id', authMiddleware([], ['manager', 'supervisor']), uploadImage.single('gambar'), apiResponse(editInsentif));
router.delete('/:id', authMiddleware([], ['manager', 'supervisor']), apiResponse(deleteInsentif));

export default router;
