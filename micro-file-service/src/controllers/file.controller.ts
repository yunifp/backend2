import { Request, Response } from 'express';
import { FileService } from '../services/file.service';
import path from 'path';

interface RequestWithFile extends Request {
    file?: Express.Multer.File;
    user?: any;
}

export const FileController = {
    async handleAction(req: Request, res: Response) {
        try {
            const mReq = req as RequestWithFile;

            // Pengecekan body agar tidak error destructuring
            if (!mReq.body) {
                return res.status(400).json({ success: false, message: 'Request body is missing' });
            }

            const { action, id, isPublic, folder } = mReq.body;
            const userId = mReq.user?.id || 0;

            switch (action) {
                case 'UPLOAD':
                    if (!mReq.file) throw new Error('File tidak ditemukan dalam request');

                    // Konversi string 'true' dari FormData menjadi boolean
                    const publicStatus = isPublic === 'true' || isPublic === true;

                    const uploadedFile = await FileService.registerFile(
                        mReq,
                        mReq.file,
                        folder || 'general',
                        userId,
                        publicStatus
                    );
                    return res.status(201).json({ success: true, data: uploadedFile });

                case 'GET_METADATA':
                    const meta = await FileService.getFileMetadata(id);
                    if (!meta) return res.status(404).json({ success: false, message: 'File tidak ditemukan' });
                    return res.status(200).json({ success: true, data: meta });

                case 'DELETE':
                    if (!id) throw new Error('ID file diperlukan untuk menghapus');
                    await FileService.deleteFile(mReq, id);
                    return res.status(200).json({ success: true, message: 'File berhasil dihapus' });

                case 'SET_PRIVACY':
                    const updated = await FileService.updatePrivacy(mReq, id, isPublic === 'true' || isPublic === true);
                    return res.status(200).json({ success: true, data: updated });

                case 'STREAM':
                    // Kasus STREAM via POST (dengan body id)
                    const fileMeta = await FileService.getFileMetadata(id);
                    if (!fileMeta) return res.status(404).send('File tidak ditemukan');

                    if (!fileMeta.isPublic && fileMeta.uploadedBy !== userId) {
                        return res.status(403).json({ success: false, message: 'Akses ditolak' });
                    }

                    return res.sendFile(path.resolve(fileMeta.path));

                default:
                    return res.status(400).json({ success: false, message: 'Aksi tidak valid' });
            }
        } catch (error: any) {
            console.error("[File Controller Error]:", error.message);
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    // Method untuk GET /view/:id (Supaya gambar bisa tampil di tag <img>)
    async streamFileStatic(req: Request, res: Response) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const file = await FileService.getFileMetadata(id);

            if (!file) return res.status(404).send('File tidak ditemukan');

            // Opsional: Tambahkan logika proteksi jika file bukan isPublic
            // if (!file.isPublic) { ... }

            const absolutePath = path.resolve(file.path);
            return res.sendFile(absolutePath);
        } catch (error) {
            return res.status(500).send('Internal Server Error');
        }
    }
};