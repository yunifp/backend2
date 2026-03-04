import { Router } from 'express';
import { KarirController } from '../controllers/karir.controller';
import { restrictToInternal } from '../middlewares/gatewayMiddleware';
import { extractUserFromHeader } from '../middlewares/extractUser.middleware';
import { authorizeAction } from '../middlewares/rbac.middleware';

const router = Router();

router.post('/karir', restrictToInternal, extractUserFromHeader, KarirController.handleKarirAction);
router.post('/sektor', restrictToInternal, extractUserFromHeader, KarirController.handleSektorAction);

export default router;