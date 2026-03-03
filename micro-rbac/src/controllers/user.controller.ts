import { Request, Response } from 'express';
import UserService from '../services/users.service';

const sanitizeResponse = (data: any) => {
    const stringified = JSON.stringify(data, (key, value) => {
        if (key === 'password' || key === 'passwordTemp') return undefined; // Hapus password
        if (typeof value === 'bigint') return value.toString(); // Handle BigInt
        return value;
    });
    return JSON.parse(stringified);
};

const UserController = {
    async handleAction(req: Request, res: Response) {
        try {
            const { action, data, id, page, limit, search } = req.body;

            switch (action) {
                case 'GET_ALL':
                    const result = await UserService.getAll({
                        page: Number(page) || 1,
                        limit: Number(limit) || 10,
                        search: search
                    });
                    return res.status(200).json({
                        success: true,
                        data: sanitizeResponse(result.data),
                        total: result.total
                    });

                case 'CREATE':
                    const newUser = await UserService.create(req, data);
                    return res.status(201).json({ success: true, message: 'User dibuat', data: sanitizeResponse(newUser) });

                case 'UPDATE':
                    const updated = await UserService.update(req, Number(id), data);
                    return res.status(200).json({ success: true, message: 'User diupdate', data: sanitizeResponse(updated) });

                case 'DELETE':
                    await UserService.delete(req, Number(id));
                    return res.status(200).json({ success: true, message: 'User dihapus' });
                    
                case 'GET_STATS':
                    const stats = await UserService.getDashboardStats();
                    return res.status(200).json({
                        success: true,
                        data: stats
                    });
                default:
                    return res.status(400).json({ success: false, message: 'Invalid Action' });
            }
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getById(req: Request, res: Response) {
        try {
            const { id } = req.body;
            const user = await UserService.getById(id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
            }
            return res.status(200).json({ success: true, data: sanitizeResponse(user) });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

export default UserController;