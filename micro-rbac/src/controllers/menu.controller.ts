import { Request, Response } from 'express';
import { ZodError } from 'zod';
import MenuService from '../services/menu.service';
import { CreateMenuSchema, UpdateMenuSchema } from '../validations/menu.validation';

const sanitizeResponse = (data: any) => {
    const stringified = JSON.stringify(data, (_, value) => {
        if (typeof value === 'bigint') return value.toString();
        return value;
    });
    return JSON.parse(stringified);
};

const MenuController = {
    async handleAction(req: Request, res: Response): Promise<any> {
        try {
            const { action, data, id, page = 1, limit = 10, search } = req.body;

            switch (action) {
                case 'GET_ALL':
                    const menus = await MenuService.getAll(Number(page), Number(limit), search);
                    return res.status(200).json({
                        success: true,
                        data: sanitizeResponse(menus.data),
                        meta: menus.meta
                    });

                case 'GET_BY_ID':
                    const targetId = id || data?.idMenu;
                    if (!targetId) throw new Error('ID_REQUIRED');
                    const menu = await MenuService.getById(Number(targetId));
                    if (!menu) return res.status(404).json({ success: false, message: 'Menu tidak ditemukan' });
                    return res.status(200).json({ success: true, data: sanitizeResponse(menu) });

                case 'GET_ALL_PERMISSIONS':
                    const permissions = await MenuService.getAllPermissions();
                    return res.status(200).json({ success: true, data: sanitizeResponse(permissions) });

                case 'CREATE':
                    // Zod validation (CreateMenuSchema harus sudah mencakup array 'permissions')
                    const validatedCreate = CreateMenuSchema.parse(data);
                    const newMenu = await MenuService.create(req, validatedCreate);
                    return res.status(201).json({
                        success: true,
                        message: 'Berhasil membuat Menu dan daftar aksi tersedia',
                        data: sanitizeResponse(newMenu)
                    });

                case 'UPDATE':
                    const updateId = id || data?.idMenu;
                    if (!updateId) throw new Error('ID_REQUIRED');
                    const validatedUpdate = UpdateMenuSchema.parse(data);
                    const updatedMenu = await MenuService.update(req, Number(updateId), validatedUpdate);
                    return res.status(200).json({
                        success: true,
                        message: 'Berhasil memperbarui Menu dan sinkronisasi Permission',
                        data: sanitizeResponse(updatedMenu)
                    });

                case 'DELETE':
                    const deleteId = id || data?.idMenu;
                    if (!deleteId) throw new Error('ID_REQUIRED');
                    await MenuService.delete(req, Number(deleteId));
                    return res.status(200).json({ success: true, message: 'Berhasil menghapus Menu' });

                default:
                    return res.status(400).json({ success: false, message: 'Action tidak valid' });
            }
        } catch (error: any) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Validasi gagal',
                    errors: error.issues
                });
            }
            return res.status(500).json({
                success: false,
                message: error.message || 'Internal Server Error'
            });
        }
    }
};

export default MenuController;