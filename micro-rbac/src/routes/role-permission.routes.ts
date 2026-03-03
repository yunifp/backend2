import { Router } from 'express';
import { PermissionController } from '../controllers/permission.controller';
import { RolePermissionController } from '../controllers/role-permission.controller';
import { restrictToInternal } from '../middlewares/gatewayMiddleware';
import { extractUserFromHeader } from '../middlewares/extractUser.middleware';
import { authorizeAction } from '../middlewares/rbac.middleware';

const router = Router();

const permissionActionMap = {
    'READ': 'R',
    'CREATE': 'C',
    'UPDATE': 'U',
    'DELETE': 'D'
};

const rolePermissionActionMap = {
    'GET_ALL': 'R',
    'CREATE_GROUP': 'C',
    'UPDATE_GROUP': 'U',
    'DELETE_GROUP': 'D',
    'GET_ROLE_CONFIG': 'UR',
    'SAVE_MAPPING': 'UR'
};

router.post('/permissions', restrictToInternal, extractUserFromHeader, authorizeAction(permissionActionMap), PermissionController.handleAction);
router.post('/role-permissions', restrictToInternal, extractUserFromHeader, authorizeAction(rolePermissionActionMap), RolePermissionController.handleAction);



export default router;