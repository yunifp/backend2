import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { restrictToInternal } from '../middlewares/gatewayMiddleware';
import { extractUserFromHeader } from '../middlewares/extractUser.middleware';
import { authorizeAction } from '../middlewares/rbac.middleware';

const router = Router();

router.post('/create-profile', restrictToInternal, ProfileController.createNewProfile);
router.post('/', restrictToInternal, extractUserFromHeader, ProfileController.handleAction);

export default router;