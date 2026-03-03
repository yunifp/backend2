import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import * as GatewayMiddleware from '../middlewares/gatewayMiddleware';

const router = Router();

router.post('/login', GatewayMiddleware.restrictToInternal, AuthController.loginController);
router.post('/refresh', GatewayMiddleware.restrictToInternal, AuthController.refreshController);
router.post('/me', GatewayMiddleware.restrictToInternal, AuthController.meController);
router.post('/logout', AuthController.logoutController);
router.post('/register', AuthController.registerController);
export default router;