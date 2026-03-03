import { Request, Response } from 'express';
import { RolePermissionService } from '../services/role-permission.service';

const service = new RolePermissionService();

export const RolePermissionController = {
    async handleAction(req: Request, res: Response): Promise<any> {
        try {
            const { action, idUserGroup, namaUserGroup, menuConfigs } = req.body;

            switch (action) {
                case 'GET_ALL':
                    const groups = await service.getAllGroups();
                    return res.json({ success: true, data: groups });

                case 'CREATE_GROUP':
                    const newGroup = await service.createUserGroup(req, namaUserGroup);
                    return res.json({ success: true, data: newGroup });

                case 'UPDATE_GROUP':
                    const updated = await service.updateUserGroup(req, Number(idUserGroup), namaUserGroup);
                    return res.json({ success: true, data: updated });

                case 'DELETE_GROUP':
                    await service.deleteUserGroup(req, Number(idUserGroup));
                    return res.json({ success: true, message: "Group deleted" });

                case 'GET_ROLE_CONFIG':
                    const config = await service.getRoleConfig(Number(idUserGroup));
                    return res.json({ success: true, data: config });

                case 'SAVE_MAPPING':
                    const result = await service.updateRoleMenuConfig(req, Number(idUserGroup), menuConfigs);
                    return res.json({ success: true, data: result });

                default:
                    return res.status(400).json({ success: false, message: "Invalid Action" });
            }
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
};