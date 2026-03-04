import { prisma } from '../lib/prisma';
import { recordAuditTrail } from '../lib/audit';

export const KarirService = {
    // --- SEKTOR PEKERJAAN SERVICE ---
    async getAllSektor() {
        return await prisma.sektorPekerjaan.findMany({
            orderBy: { nama_sektor: 'asc' }
        });
    },

    async createSektor(req: any, data: any) {
        const result = await prisma.sektorPekerjaan.create({
            data: {
                id_sektor: data.id_sektor, // ID manual (misal: 'IT', 'FIN', 'EDU')
                nama_sektor: data.nama_sektor
            }
        });
        recordAuditTrail({
            req, tableName: 'sektor_pekerjaans', recordId: result.id_sektor,
            action: 'CREATE', dbOperation: 'INSERT', oldData: null, newData: result
        });
        return result;
    },

    async deleteSektor(req: any, id: string) {
        const hasKarir = await prisma.karir.count({ where: { sektor_pekerjaan_id: id } });
        if (hasKarir > 0) throw new Error("Gagal: Sektor ini masih digunakan oleh data karir alumni.");

        const oldData = await prisma.sektorPekerjaan.findUnique({ where: { id_sektor: id } });
        await prisma.sektorPekerjaan.delete({ where: { id_sektor: id } });

        recordAuditTrail({
            req, tableName: 'sektor_pekerjaans', recordId: id,
            action: 'DELETE', dbOperation: 'DELETE', oldData, newData: null
        });
        return true;
    },

    // --- KARIR SERVICE ---
    async getAllKarir(params: { userId?: number; search?: string }) {
        const { userId, search } = params;
        const where: any = {};
        
        if (userId) where.id_pengguna = Number(userId);
        if (search) {
            where.OR = [
                { nama_perusahaan: { contains: search, mode: 'insensitive' } },
                { posisi_pekerjaan: { contains: search, mode: 'insensitive' } }
            ];
        }

        return await prisma.karir.findMany({
            where,
            include: { sektor: true },
            orderBy: { tahun_masuk: 'desc' }
        });
    },

    async createKarir(req: any, data: any) {
        // Logic: Jika 'saat_ini' true, maka tahun_keluar otomatis null
        const result = await prisma.karir.create({
            data: {
                id_pengguna: Number(data.id_pengguna),
                posisi_pekerjaan: data.posisi_pekerjaan,
                nama_perusahaan: data.nama_perusahaan,
                lokasi_pekerjaan: data.lokasi_pekerjaan,
                tahun_masuk: Number(data.tahun_masuk),
                tahun_keluar: data.saat_ini ? null : (data.tahun_keluar ? Number(data.tahun_keluar) : null),
                saat_ini: Boolean(data.saat_ini),
                jenis_pekerjaan: data.jenis_pekerjaan,
                sektor_pekerjaan_id: data.sektor_pekerjaan_id
            }
        });

        recordAuditTrail({
            req, tableName: 'karirs', recordId: result.id_karir,
            action: 'CREATE', dbOperation: 'INSERT', oldData: null, newData: result
        });
        return result;
    },

    async updateKarir(req: any, id: number, data: any) {
        const oldData = await prisma.karir.findUnique({ where: { id_karir: id } });
        if (!oldData) throw new Error("Data karir tidak ditemukan.");

        const result = await prisma.karir.update({
            where: { id_karir: id },
            data: {
                ...data,
                id_pengguna: data.id_pengguna ? Number(data.id_pengguna) : undefined,
                tahun_masuk: data.tahun_masuk ? Number(data.tahun_masuk) : undefined,
                tahun_keluar: data.saat_ini ? null : (data.tahun_keluar ? Number(data.tahun_keluar) : undefined),
                saat_ini: data.saat_ini !== undefined ? Boolean(data.saat_ini) : undefined,
            }
        });

        recordAuditTrail({
            req, tableName: 'karirs', recordId: id,
            action: 'UPDATE', dbOperation: 'UPDATE', oldData, newData: result
        });
        return result;
    },

    async deleteKarir(req: any, id: number) {
        const oldData = await prisma.karir.findUnique({ where: { id_karir: id } });
        if (!oldData) throw new Error("Data tidak ditemukan.");

        await prisma.karir.delete({ where: { id_karir: id } });

        recordAuditTrail({
            req, tableName: 'karirs', recordId: id,
            action: 'DELETE', dbOperation: 'DELETE', oldData, newData: null
        });
        return true;
    }
};