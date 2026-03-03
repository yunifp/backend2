import { PrismaClient } from '@prisma/client';
import { recordAuditTrail } from '../lib/audit';

const prisma = new PrismaClient();

export class PermissionService {
    async getAll() {
        return await prisma.refPermission.findMany({
            orderBy: { idPermission: 'asc' }
        });
    }

    async create(req: any, data: { code: string; nama: string; isDefault?: boolean }) {
        const result = await prisma.refPermission.create({ data });
        recordAuditTrail({
            req,
            tableName: 'ref_permission',
            recordId: result.idPermission,
            action: 'CREATE',
            dbOperation: 'INSERT',
            oldData: null,
            newData: result
        });
        return result;
    }

    async update(req: any, id: number, data: { code: string; nama: string; isDefault?: boolean }) {
        const oldData = await prisma.refPermission.findUnique({
            where: { idPermission: id }
        });

        const result = await prisma.refPermission.update({
            where: { idPermission: id },
            data
        });

        recordAuditTrail({
            req,
            tableName: 'ref_permission',
            recordId: id,
            action: 'UPDATE',
            dbOperation: 'UPDATE',
            oldData,
            newData: result
        });
    }

    async delete(req: any, id: number) {
        const oldData = await prisma.refPermission.findUnique({
            where: { idPermission: id }
        });

        const result = await prisma.refPermission.delete({
            where: { idPermission: id }
        });

        recordAuditTrail({
            req,
            tableName: 'ref_permission',
            recordId: id,
            action: 'DELETE',
            dbOperation: 'DELETE',
            oldData,
            newData: null
        });

        return result;
    }
}