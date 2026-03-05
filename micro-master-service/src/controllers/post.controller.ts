import { Request, Response } from 'express';
import { PostService } from '../services/post.service';

export const PostController = {
    async handleKategoriAction(req: Request, res: Response) {
        try {
            const { action, id, data } = req.body;
            switch (action) {
                case 'GET_ALL':
                    const list = await PostService.getAllKategori();
                    return res.status(200).json({ success: true, data: list });
                case 'CREATE':
                    const created = await PostService.createKategori(req, data);
                    return res.status(201).json({ success: true, data: created });
                case 'DELETE':
                    await PostService.deleteKategori(req, Number(id));
                    return res.status(200).json({ success: true, message: 'Kategori berhasil dihapus' });
                default:
                    return res.status(400).json({ success: false, message: 'Aksi tidak valid' });
            }
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async handlePostAction(req: Request, res: Response) {
        try {
            const { action, id, page = 1, limit = 10, search, status, kategoriId } = req.body;
            
            let parsedData = req.body.data;
            if (typeof parsedData === 'string') {
                try {
                    parsedData = JSON.parse(parsedData);
                } catch (e) {
                    return res.status(400).json({ success: false, message: 'Format data tidak valid' });
                }
            }

            switch (action) {
                case 'GET_ALL':
                    const result = await PostService.getAllPost({
                        page: Number(page), limit: Number(limit), search, status, kategoriId
                    });
                    return res.status(200).json({
                        success: true,
                        data: result.data,
                        meta: { total: result.total, page: Number(page), limit: Number(limit) }
                    });
                case 'CREATE':
                    const created = await PostService.createPost(req, parsedData);
                    return res.status(201).json({ success: true, data: created });
                case 'UPDATE':
                    const updated = await PostService.updatePost(req, Number(id), parsedData);
                    return res.status(200).json({ success: true, data: updated });
                case 'DELETE':
                    await PostService.deletePost(req, Number(id));
                    return res.status(200).json({ success: true, message: 'Postingan berhasil dihapus' });
                case 'INCREMENT_VIEW':
                    await PostService.incrementView(Number(id));
                    return res.status(200).json({ success: true });
                default:
                    return res.status(400).json({ success: false, message: 'Aksi tidak valid' });
            }
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
};