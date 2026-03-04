import { prisma } from '../lib/prisma';
import { recordAuditTrail } from '../lib/audit';

// Helper sederhana untuk membuat slug dari judul
const createSlug = (text: string) => {
    return text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
};

export const PostService = {
    // --- KATEGORI POST SERVICE ---
    async getAllKategori() {
        return await prisma.kategoriPost.findMany({
            orderBy: { nama: 'asc' },
            include: { _count: { select: { posts: true } } }
        });
    },

    async createKategori(req: any, data: any) {
        const result = await prisma.kategoriPost.create({ data });
        recordAuditTrail({
            req, tableName: 'kategori_posts', recordId: result.id_kategori,
            action: 'CREATE', dbOperation: 'INSERT', oldData: null, newData: result
        });
        return result;
    },

    async deleteKategori(req: any, id: number) {
        const hasPosts = await prisma.postingan.count({ where: { kategori_id: id } });
        if (hasPosts > 0) throw new Error("Gagal: Kategori ini masih memiliki postingan.");

        const oldData = await prisma.kategoriPost.findUnique({ where: { id_kategori: id } });
        await prisma.kategoriPost.delete({ where: { id_kategori: id } });

        recordAuditTrail({
            req, tableName: 'kategori_posts', recordId: id,
            action: 'DELETE', dbOperation: 'DELETE', oldData, newData: null
        });
        return true;
    },

    // --- POSTINGAN SERVICE ---
    async getAllPost(params: {
        page: number;
        limit: number;
        search?: string;
        status?: any;
        kategoriId?: number;
    }) {
        const { page, limit, search, status, kategoriId } = params;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (search) where.judul = { contains: search, mode: 'insensitive' };
        if (status) where.status = status;
        if (kategoriId) where.kategori_id = Number(kategoriId);

        const [data, total] = await Promise.all([
            prisma.postingan.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: { kategori: true }
            }),
            prisma.postingan.count({ where })
        ]);

        return { data, total };
    },

    async createPost(req: any, data: any) {
        const result = await prisma.postingan.create({
            data: {
                ...data,
                slug: data.slug || `${createSlug(data.judul)}-${Date.now()}`,
                kategori_id: Number(data.kategori_id),
                author_id: Number(data.author_id),
                diterbitkan: data.status === 'PUBLISHED' ? new Date() : null
            }
        });

        recordAuditTrail({
            req, tableName: 'postingans', recordId: result.id_post,
            action: 'CREATE', dbOperation: 'INSERT', oldData: null, newData: result
        });
        return result;
    },

    async updatePost(req: any, id: number, data: any) {
        const oldData = await prisma.postingan.findUnique({ where: { id_post: id } });
        if (!oldData) throw new Error("Postingan tidak ditemukan.");

        // Update tanggal terbit jika status berubah menjadi PUBLISHED
        let publishedAt = oldData.diterbitkan;
        if (data.status === 'PUBLISHED' && oldData.status !== 'PUBLISHED') {
            publishedAt = new Date();
        }

        const result = await prisma.postingan.update({
            where: { id_post: id },
            data: {
                ...data,
                kategori_id: data.kategori_id ? Number(data.kategori_id) : undefined,
                diterbitkan: publishedAt
            }
        });

        recordAuditTrail({
            req, tableName: 'postingans', recordId: id,
            action: 'UPDATE', dbOperation: 'UPDATE', oldData, newData: result
        });
        return result;
    },

    async incrementView(id: number) {
        return await prisma.postingan.update({
            where: { id_post: id },
            data: { jumlah_view: { increment: 1 } }
        });
    }
};