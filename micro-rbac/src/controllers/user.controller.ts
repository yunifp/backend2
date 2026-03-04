import { Request, Response } from 'express';
import UserService from '../services/users.service';

const sanitizeResponse = (data: any) => {
    return JSON.parse(JSON.stringify(data, (key, value) => {
        if (key === 'password') return undefined;
        if (typeof value === 'bigint') return value.toString();
        return value;
    }));
};

const UserController = {
    async handleAction(req: Request, res: Response) {
        try {
            const { action, data, id, page, limit, search, role, status } = req.body;

            switch (action) {
                case 'GET_ALL':
                    const result = await UserService.getAll({
                        page: Number(page) || 1,
                        limit: Number(limit) || 10,
                        search: search,
                        role: role,
                        status: status
                    });
                    return res.status(200).json({
                        success: true,
                        data: result.data,
                        total: result.total
                    });

                case 'UPDATE':
                    if (!id) {
                        return res.status(400).json({
                            success: false,
                            message: 'ID wajib diisi'
                        });
                    }

                    const updatedUserData = await UserService.update(
                        req,
                        Number(id),
                        data
                    );

                    return res.status(200).json({
                        success: true,
                        message: 'Data user berhasil diperbarui',
                        data: sanitizeResponse(updatedUserData)
                    });

                case 'UPDATE_STATUS':
                    if (!id || !data?.status) {
                        return res.status(400).json({ success: false, message: 'ID dan status wajib diisi' });
                    }
                    const updated = await UserService.updateStatus(Number(id), data.status);
                    return res.status(200).json({
                        success: true,
                        message: `Status berhasil diubah menjadi ${data.status}`,
                        data: updated
                    });

                case 'UPDATE_PASSWORD':
                    if (!id || !data?.newPassword) {
                        return res.status(400).json({ success: false, message: 'ID dan newPassword wajib diisi' });
                    }
                    const updatedPassword = await UserService.updatePassword(req, Number(id), data.newPassword);
                    return res.status(200).json({
                        success: true,
                        message: 'Password berhasil diubah',
                        data: updatedPassword
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
            if (!id) return res.status(400).json({ success: false, message: 'ID diperlukan' });

            const user = await UserService.getById(Number(id));
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