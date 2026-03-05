// src/middlewares/uploadMiddleware.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = req.body.folder || 'misc';
        const uploadPath = path.join(process.cwd(), 'uploads', folder);

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

export const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const dangerousExtensions = ['.exe', '.bat', '.sh', '.php', '.js', '.env'];
        const ext = path.extname(file.originalname).toLowerCase();

        if (dangerousExtensions.includes(ext)) {
            return cb(new Error(`Security Alert: File tipe ${ext} dilarang!`));
        }
        cb(null, true);
    }
});