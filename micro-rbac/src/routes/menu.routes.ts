import { Router } from 'express';
import MenuController from '../controllers/menu.controller';
import { restrictToInternal } from '../middlewares/gatewayMiddleware';
import { extractUserFromHeader } from '../middlewares/extractUser.middleware';
import { authorizeAction } from '../middlewares/rbac.middleware';

const router = Router();

const menuActionMap = {
    'GET_ALL': 'R',
    'GET_BY_ID': 'R',
    'GET_ALL_PERMISSIONS': 'MAM',
    'CREATE': 'C',
    'UPDATE': 'U',
    'DELETE': 'D'
};

router.post('/', restrictToInternal, extractUserFromHeader, authorizeAction(menuActionMap), MenuController.handleAction);

export default router;