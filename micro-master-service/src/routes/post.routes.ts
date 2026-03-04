import { Router } from 'express';
import { PostController } from '../controllers/post.controller';
import { restrictToInternal } from '../middlewares/gatewayMiddleware';
import { extractUserFromHeader } from '../middlewares/extractUser.middleware';
import { authorizeAction } from '../middlewares/rbac.middleware';

const router = Router();

router.post('/post', restrictToInternal, extractUserFromHeader, PostController.handlePostAction);
router.post('/kategori', restrictToInternal, extractUserFromHeader, PostController.handleKategoriAction);

export default router;