import { Router } from 'express';
import UserController from '../controllers/user.controller';
import { restrictToInternal } from '../middlewares/gatewayMiddleware';
import { extractUserFromHeader } from '../middlewares/extractUser.middleware';
import { authorizeAction } from '../middlewares/rbac.middleware'; 

const router = Router();


router.post('/', 
    restrictToInternal, 
    extractUserFromHeader, 
    UserController.handleAction
);

router.post('/get-by-id', 
    restrictToInternal, 
    extractUserFromHeader, 
    UserController.getById
);

export default router;