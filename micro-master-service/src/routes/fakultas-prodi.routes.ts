import { Router } from 'express';
import { FakultasProdiController } from '../controllers/fakultas-prodi.controller';
import { restrictToInternal } from '../middlewares/gatewayMiddleware';
import { extractUserFromHeader } from '../middlewares/extractUser.middleware';
import { authorizeAction } from '../middlewares/rbac.middleware';

const router = Router();

router.post('/fakultas', restrictToInternal, extractUserFromHeader, FakultasProdiController.handleFakultasAction);
router.post('/prodi', restrictToInternal, extractUserFromHeader, FakultasProdiController.handleProdiAction);

export default router;