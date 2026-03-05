import { prisma } from '../lib/prisma';
import fs from 'fs';
import { recordAuditTrail } from '../lib/audit';

export const FileService = {
    async registerFile(req: any, file: Express.Multer.File, folder: string, userId: number, isPublic: boolean = false) {
        const result = await prisma.file.create({
            data: {
                filename: file.filename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                path: file.path,
                folder: folder,
                uploadedBy: userId,
                isPublic: isPublic // Menggunakan parameter yang dikirim controller
            }
        });

        recordAuditTrail({
            req, tableName: 'files', recordId: result.id,
            action: 'CREATE', dbOperation: 'INSERT', oldData: null, newData: result
        });

        return result;
    },

    async getFileMetadata(id: string) {
        return await prisma.file.findUnique({ where: { id } });
    },

    async deleteFile(req: any, id: string) {
        const fileRecord = await prisma.file.findUnique({ where: { id } });
        if (!fileRecord) throw new Error("Data file tidak ditemukan di database");

        // Hapus fisik file
        if (fs.existsSync(fileRecord.path)) {
            fs.unlinkSync(fileRecord.path);
        }

        const result = await prisma.file.delete({ where: { id } });

        recordAuditTrail({
            req, tableName: 'files', recordId: id,
            action: 'DELETE', dbOperation: 'DELETE', oldData: fileRecord, newData: null
        });
        return result;
    },

    async updatePrivacy(req: any, id: string, isPublic: boolean) {
        const fileRecord = await prisma.file.findUnique({ where: { id } });
        if (!fileRecord) throw new Error("File tidak ditemukan");

        const result = await prisma.file.update({
            where: { id },
            data: { isPublic }
        });

        recordAuditTrail({
            req, tableName: 'files', recordId: id,
            action: 'UPDATE', dbOperation: 'UPDATE', oldData: fileRecord, newData: result
        });
        return result;
    }
};