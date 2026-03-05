import { Router } from 'express';
import { PostController } from '../controllers/post.controller';
import { restrictToInternal } from '../middlewares/gatewayMiddleware';
import { extractUserFromHeader } from '../middlewares/extractUser.middleware';
import multer from 'multer';

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post('/post', restrictToInternal, extractUserFromHeader, upload.single('file'), PostController.handlePostAction);
router.post('/kategori', restrictToInternal, extractUserFromHeader, PostController.handleKategoriAction);

export default router;