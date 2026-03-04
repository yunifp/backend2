import { prisma } from '../lib/prisma';
import { recordAuditTrail } from '../lib/audit';

export const FakultasProdiService = {
    // --- FAKULTAS SERVICE ---
    async getAllFakultas() {
        return await prisma.fakultas.findMany({
            orderBy: { nama: 'asc' },
            include: { _count: { select: { prodis: true } } }
        });
    },

    async createFakultas(req: any, data: any) {
        const result = await prisma.fakultas.create({ data });
        recordAuditTrail({
            req, tableName: 'fakultas', recordId: result.id_fakultas,
            action: 'CREATE', dbOperation: 'INSERT', oldData: null, newData: result
        });
        return result;
    },

    async updateFakultas(req: any, id: number, data: any) {
        const oldData = await prisma.fakultas.findUnique({ where: { id_fakultas: id } });
        if (!oldData) throw new Error("Fakultas tidak ditemukan.");

        const result = await prisma.fakultas.update({
            where: { id_fakultas: id },
            data
        });

        recordAuditTrail({
            req, tableName: 'fakultas', recordId: id,
            action: 'UPDATE', dbOperation: 'UPDATE', oldData, newData: result
        });
        return result;
    },

    async deleteFakultas(req: any, id: number) {
        const hasProdi = await prisma.prodi.count({ where: { fakultas_id: id } });
        if (hasProdi > 0) throw new Error("Gagal: Fakultas ini masih memiliki data Program Studi.");

        const oldData = await prisma.fakultas.findUnique({ where: { id_fakultas: id } });
        await prisma.fakultas.delete({ where: { id_fakultas: id } });

        recordAuditTrail({
            req, tableName: 'fakultas', recordId: id,
            action: 'DELETE', dbOperation: 'DELETE', oldData, newData: null
        });
        return true;
    },

    // --- PRODI SERVICE ---
    async getAllProdi(params: { search?: string; fakultasId?: number }) {
        const { search, fakultasId } = params;
        const where: any = {};

        if (search) where.nama = { contains: search, mode: 'insensitive' };
        if (fakultasId) where.fakultas_id = Number(fakultasId);

        return await prisma.prodi.findMany({
            where,
            include: { fakultas: true },
            orderBy: { nama: 'asc' }
        });
    },

    async createProdi(req: any, data: any) {
        const result = await prisma.prodi.create({
            data: {
                nama: data.nama,
                fakultas_id: Number(data.fakultas_id)
            }
        });
        recordAuditTrail({
            req, tableName: 'prodis', recordId: result.id_prodi,
            action: 'CREATE', dbOperation: 'INSERT', oldData: null, newData: result
        });
        return result;
    },

    async updateProdi(req: any, id: number, data: any) {
        const oldData = await prisma.prodi.findUnique({ where: { id_prodi: id } });
        if (!oldData) throw new Error("Prodi tidak ditemukan.");

        const result = await prisma.prodi.update({
            where: { id_prodi: id },
            data: {
                nama: data.nama,
                fakultas_id: data.fakultas_id ? Number(data.fakultas_id) : undefined
            }
        });

        recordAuditTrail({
            req, tableName: 'prodis', recordId: id,
            action: 'UPDATE', dbOperation: 'UPDATE', oldData, newData: result
        });
        return result;
    },

    async deleteProdi(req: any, id: number) {
        // Cek apakah ada profil mahasiswa/alumni di prodi ini
        const hasProfiles = await prisma.profile.count({ where: { program_studi_id: id } });
        if (hasProfiles > 0) throw new Error("Gagal: Prodi ini masih memiliki data Alumni.");

        const oldData = await prisma.prodi.findUnique({ where: { id_prodi: id } });
        await prisma.prodi.delete({ where: { id_prodi: id } });

        recordAuditTrail({
            req, tableName: 'prodis', recordId: id,
            action: 'DELETE', dbOperation: 'DELETE', oldData, newData: null
        });
        return true;
    }
};