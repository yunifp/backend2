import { Router } from 'express';
import UserGroupController from '../controllers/userGroup.controller';
import { restrictToInternal } from '../middlewares/gatewayMiddleware';
import { extractUserFromHeader } from '../middlewares/extractUser.middleware';
import { authorizeAction } from '../middlewares/rbac.middleware';

const router = Router();

const userGroupActionMap = {
    'GET_ALL': 'R',
    'GET_BY_ID': 'R',
    'CREATE': 'C',
    'UPDATE': 'U',
    'DELETE': 'D'
};

router.post('/', restrictToInternal, extractUserFromHeader, authorizeAction(userGroupActionMap), UserGroupController.handleAction);

export default router;