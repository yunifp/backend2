import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { restrictToInternal } from '../middlewares/gatewayMiddleware';
import { extractUserFromHeader } from '../middlewares/extractUser.middleware';
import { authorizeAction } from '../middlewares/rbac.middleware';
import { upload } from '../lib/upload'; // Import multer middleware

const router = Router();

// Route untuk melihat file (Public/Streaming)
router.get('/view/:id', restrictToInternal, FileController.streamFileStatic);

// Route POST utama
// Tambahkan upload.single('file') DISINI
router.post(
    '/',
    restrictToInternal,
    extractUserFromHeader,
    upload.single('file'),
    FileController.handleAction
);

export default router;