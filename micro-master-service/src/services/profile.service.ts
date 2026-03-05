import { prisma } from '../lib/prisma';
import { recordAuditTrail } from '../lib/audit';

export const ProfileService = {
    async getAll(params: {
        page: number;
        limit: number;
        search?: string;
        prodiId?: number;
    }) {
        const { page, limit, search, prodiId } = params;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (search) {
            where.OR = [
                { nama_lengkap: { contains: search, mode: 'insensitive' } },
                { judul_skripsi: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (prodiId) where.program_studi_id = Number(prodiId);

        const [data, total] = await Promise.all([
            prisma.profile.findMany({
                where,
                skip,
                take: limit,
                orderBy: { nama_lengkap: 'asc' },
                include: { prodi: { include: { fakultas: true } } }
            }),
            prisma.profile.count({ where })
        ]);

        return { data, total };
    },

    async getById(id: number) {
        return await prisma.profile.findUnique({
            where: { id_pengguna: id },
            include: { prodi: { include: { fakultas: true } } }
        });
    },

    async create(req: any, inputData: any) {
        const result = await prisma.profile.create({
            data: {
                ...inputData,
                tanggal_lahir: inputData.tanggal_lahir ? new Date(inputData.tanggal_lahir) : null,
                tanggal_wisuda: inputData.tanggal_wisuda ? new Date(inputData.tanggal_wisuda) : null,
            }
        });

        recordAuditTrail({
            req, tableName: 'profiles', recordId: result.id_pengguna,
            action: 'CREATE', dbOperation: 'INSERT', oldData: null, newData: result
        });
        return result;
    },

    async update(req: any, id: number, inputData: any) {
        const oldData = await prisma.profile.findUnique({ where: { id_pengguna: id } });
        if (!oldData) throw new Error("Profil tidak ditemukan.");

        // 1. BUANG properti yang bisa menyebabkan error pada Prisma Update
        // Kita buang 'prodi' (objek relasi) dan 'id_pengguna' (Primary Key) dari payload
        const { prodi, id_pengguna, ...payload } = inputData;

        const result = await prisma.profile.update({
            where: { id_pengguna: id },
            data: {
                ...payload,
                // 2. Pastikan konversi tipe data Int untuk field angka
                program_studi_id: payload.program_studi_id ? Number(payload.program_studi_id) : null,
                angkatan: payload.angkatan ? Number(payload.angkatan) : null,
                tahun_lulus: payload.tahun_lulus ? Number(payload.tahun_lulus) : null,

                // 3. Pastikan penanganan tanggal yang aman
                tanggal_lahir: payload.tanggal_lahir ? new Date(payload.tanggal_lahir) : null,
                tanggal_wisuda: payload.tanggal_wisuda ? new Date(payload.tanggal_wisuda) : null,
            }
        });

        recordAuditTrail({
            req, tableName: 'profiles', recordId: id,
            action: 'UPDATE', dbOperation: 'UPDATE', oldData, newData: result
        });

        return result;
    },

    async delete(req: any, id: number) {
        const oldData = await prisma.profile.findUnique({ where: { id_pengguna: id } });
        if (!oldData) throw new Error("Data tidak ditemukan.");

        await prisma.profile.delete({ where: { id_pengguna: id } });

        recordAuditTrail({
            req, tableName: 'profiles', recordId: id,
            action: 'DELETE', dbOperation: 'DELETE', oldData, newData: null
        });

        return true;
    },

    async getStats() {
        const [totalAlumni, perJenjang] = await Promise.all([
            prisma.profile.count(),
            prisma.profile.groupBy({
                by: ['jenjang'],
                _count: true
            })
        ]);
        return { totalAlumni, perJenjang };
    }
};