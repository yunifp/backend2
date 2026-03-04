import { Request, Response } from 'express';
import { KarirService } from '../services/karir.service';

export const KarirController = {
    async handleSektorAction(req: Request, res: Response) {
        try {
            const { action, id, data } = req.body;
            switch (action) {
                case 'GET_ALL':
                    const list = await KarirService.getAllSektor();
                    return res.status(200).json({ success: true, data: list });
                case 'CREATE':
                    const created = await KarirService.createSektor(req, data);
                    return res.status(201).json({ success: true, data: created });
                case 'DELETE':
                    await KarirService.deleteSektor(req, String(id));
                    return res.status(200).json({ success: true, message: 'Sektor berhasil dihapus' });
                default:
                    return res.status(400).json({ success: false, message: 'Aksi tidak valid' });
            }
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async handleKarirAction(req: Request, res: Response) {
        try {
            const { action, id, data, userId, search } = req.body;
            switch (action) {
                case 'GET_ALL':
                    const result = await KarirService.getAllKarir({ userId, search });
                    return res.status(200).json({ success: true, data: result });
                case 'CREATE':
                    const created = await KarirService.createKarir(req, data);
                    return res.status(201).json({ success: true, data: created });
                case 'UPDATE':
                    const updated = await KarirService.updateKarir(req, Number(id), data);
                    return res.status(200).json({ success: true, data: updated });
                case 'DELETE':
                    await KarirService.deleteKarir(req, Number(id));
                    return res.status(200).json({ success: true, message: 'Data karir berhasil dihapus' });
                default:
                    return res.status(400).json({ success: false, message: 'Aksi tidak valid' });
            }
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
};