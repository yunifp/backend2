import { Request, Response } from 'express';
import { PermissionService } from '../services/permission.service';

const service = new PermissionService();

export const PermissionController = {
    async handleAction(req: Request, res: Response): Promise<any> {
        try {
            // Destructuring sesuai standar payload yang Anda kirim dari frontend
            const { action, data, id } = req.body;

            switch (action) {
                case 'READ':
                    const allData = await service.getAll();
                    return res.json({
                        success: true,
                        data: allData
                    });

                case 'CREATE':
                    // Mengirim 'data' objek, bukan seluruh req.body
                    const newData = await service.create(req, data);
                    return res.json({
                        success: true,
                        data: newData,
                        message: "Permission berhasil ditambahkan"
                    });

                case 'UPDATE':
                    if (!id) return res.status(400).json({ success: false, message: "ID required" });

                    const updatedData = await service.update(req, Number(id), data);
                    return res.json({
                        success: true,
                        data: updatedData,
                        message: "Permission berhasil diperbarui"
                    });

                case 'DELETE':
                    if (!id) return res.status(400).json({ success: false, message: "ID required" });

                    await service.delete(req, Number(id));
                    return res.json({
                        success: true,
                        message: "Permission berhasil dihapus"
                    });

                default:
                    return res.status(400).json({
                        success: false,
                        message: "Invalid Action"
                    });
            }
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};