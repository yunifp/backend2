import { Request, Response } from 'express';
import { FakultasProdiService } from '../services/fakultas-prodi.service';

export const FakultasProdiController = {
    async handleFakultasAction(req: Request, res: Response) {
        try {
            const { action, id, data } = req.body;
            switch (action) {
                case 'GET_ALL':
                    const list = await FakultasProdiService.getAllFakultas();
                    return res.status(200).json({ success: true, data: list });
                case 'CREATE':
                    const created = await FakultasProdiService.createFakultas(req, data);
                    return res.status(201).json({ success: true, data: created });
                case 'UPDATE':
                    const updated = await FakultasProdiService.updateFakultas(req, Number(id), data);
                    return res.status(200).json({ success: true, data: updated });
                case 'DELETE':
                    await FakultasProdiService.deleteFakultas(req, Number(id));
                    return res.status(200).json({ success: true, message: 'Fakultas dihapus' });
                default:
                    throw new Error("Aksi tidak valid");
            }
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async handleProdiAction(req: Request, res: Response) {
        try {
            const { action, id, data, search, fakultasId } = req.body;
            switch (action) {
                case 'GET_ALL':
                    const list = await FakultasProdiService.getAllProdi({ search, fakultasId });
                    return res.status(200).json({ success: true, data: list });
                case 'CREATE':
                    const created = await FakultasProdiService.createProdi(req, data);
                    return res.status(201).json({ success: true, data: created });
                case 'UPDATE':
                    const updated = await FakultasProdiService.updateProdi(req, Number(id), data);
                    return res.status(200).json({ success: true, data: updated });
                case 'DELETE':
                    await FakultasProdiService.deleteProdi(req, Number(id));
                    return res.status(200).json({ success: true, message: 'Prodi dihapus' });
                default:
                    throw new Error("Aksi tidak valid");
            }
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
};