import { Request, Response } from 'express';
import { ProfileService } from '../services/profile.service';

const serializeData = (data: any) => {
    return JSON.parse(
        JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v)
    );
};

export const ProfileController = {
    async handleAction(req: Request, res: Response) {
        try {
            const { action, id, data, page = 1, limit = 10, search, prodiId } = req.body;

            switch (action) {
                case 'GET_ALL':
                    const result = await ProfileService.getAll({
                        page: Number(page),
                        limit: Number(limit),
                        search,
                        prodiId
                    });
                    return res.status(200).json({
                        success: true,
                        data: serializeData(result.data),
                        meta: {
                            total: result.total,
                            page: Number(page),
                            limit: Number(limit),
                            totalPages: Math.ceil(result.total / Number(limit))
                        }
                    });

                case 'GET_BY_ID':
                    const item = await ProfileService.getById(Number(id));
                    if (!item) return res.status(404).json({ success: false, message: 'Profil tidak ditemukan' });
                    return res.status(200).json({ success: true, data: serializeData(item) });

                case 'CREATE':
                    const created = await ProfileService.create(req, data);
                    return res.status(201).json({ success: true, data: serializeData(created) });

                case 'UPDATE':
                    const updated = await ProfileService.update(req, Number(id), data);
                    return res.status(200).json({ success: true, data: serializeData(updated) });

                case 'DELETE':
                    await ProfileService.delete(req, Number(id));
                    return res.status(200).json({ success: true, message: 'Profil berhasil dihapus' });

                case 'GET_STATS':
                    const stats = await ProfileService.getStats();
                    return res.status(200).json({ success: true, data: stats });

                default:
                    return res.status(400).json({ success: false, message: `Aksi '${action}' tidak dikenali` });
            }
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async createNewProfile(req: Request, res: Response) {
        try {
            const inputData = req.body;
            const result = await ProfileService.create(req, inputData);
            return res.status(201).json({ success: true, data: serializeData(result) });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
};