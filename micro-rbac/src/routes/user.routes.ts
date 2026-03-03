import { Router } from 'express';
import UserController from '../controllers/user.controller';
import { restrictToInternal } from '../middlewares/gatewayMiddleware';
import { extractUserFromHeader } from '../middlewares/extractUser.middleware';
import { authorizeAction } from '../middlewares/rbac.middleware';

const router = Router();

const userActionMap = {
    'GET_ALL': 'R',
    'CREATE': 'C',
    'UPDATE': 'U',
    'DELETE': 'D',
  
};
router.post('/', restrictToInternal, extractUserFromHeader, authorizeAction(userActionMap), UserController.handleAction);
router.post('/get-by-id', restrictToInternal, extractUserFromHeader, UserController.getById);

export default router;