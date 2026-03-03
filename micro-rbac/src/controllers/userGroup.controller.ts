import { Request, Response } from 'express';
import UserGroupService from '../services/userGroup.service';
import { UserGroupSchema } from '../validations/user.validation';
import { ZodError } from 'zod';

const UserGroupController = {
    async handleAction(req: Request, res: Response) {
        try {
            const { action, data, id } = req.body;

            switch (action) {
                case 'GET_ALL':
                    const groups = await UserGroupService.getAll();
                    return res.status(200).json({ success: true, data: groups });

                case 'GET_BY_ID':
                    if (!id) throw new Error('ID_REQUIRED');
                    const group = await UserGroupService.getById(Number(id));
                    if (!group) return res.status(404).json({ success: false, message: 'Grup tidak ditemukan' });
                    return res.status(200).json({ success: true, data: group });

                case 'CREATE':
                    // Validasi nama group via Zod
                    const validatedCreate = UserGroupSchema.parse(data);
                    const createPayload = { ...validatedCreate, menuIds: data.menuIds };
                    const newGroup = await UserGroupService.create(req, createPayload);
                    return res.status(201).json({
                        success: true,
                        message: 'Berhasil membuat User Group baru',
                        data: newGroup
                    });

                case 'UPDATE':
                    if (!id) throw new Error('ID_REQUIRED');
                    const validatedUpdate = UserGroupSchema.parse(data);
                    const updatePayload = { ...validatedUpdate, menuIds: data.menuIds };
                    const updatedGroup = await UserGroupService.update(req,Number(id), updatePayload);
                    return res.status(200).json({
                        success: true,
                        message: 'Berhasil memperbarui User Group dan permissions',
                        data: updatedGroup
                    });

                case 'DELETE':
                    if (!id) throw new Error('ID_REQUIRED');
                    await UserGroupService.delete(req, Number(id));
                    return res.status(200).json({
                        success: true,
                        message: 'Berhasil menghapus User Group beserta mapping terkait'
                    });

                default:
                    return res.status(400).json({ success: false, message: 'Action tidak valid' });
            }
        } catch (error: any) {
            if (error instanceof ZodError) {
                return res.status(400).json({ success: false, errors: error.issues });
            }
            if (error.message === 'ID_REQUIRED') {
                return res.status(400).json({ success: false, message: 'ID diperlukan untuk aksi ini' });
            }
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

export default UserGroupController;