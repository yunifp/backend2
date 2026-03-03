import { Router } from 'express';
// PASTIKAN path ini benar mengarah ke controller RBAC kamu
import * as InternalController from '../controllers/auth.controller';
import { restrictToInternal } from '../middlewares/gatewayMiddleware';

const router = Router();

router.post('/verify-user', restrictToInternal, InternalController.verifyUserInternal);
router.post('/validate-refresh-token', restrictToInternal, InternalController.validateRefreshInternal);
router.post('/revoke-token', restrictToInternal, InternalController.revokeTokenInternal);
router.post('/register', restrictToInternal, InternalController.registerInternal);
export default router;