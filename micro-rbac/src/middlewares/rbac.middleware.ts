import { Request, Response, NextFunction } from 'express';

interface UserPermission {
    menuId: number;
    linkEndpoint: string;
    permissions: string[];
}

interface UserSession {
    id: number;
    email: string;
    permissions: UserPermission[];
}

declare global {
    namespace Express {
        interface Request {
            user?: UserSession;
        }
    }
}



export const authorizeAction = (actionMap: Record<string, string>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;
        const { action } = req.body;

        if (!user || !user.permissions) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (action === 'GET_STATS' || action === 'GET_CHART') {
            return next(); 
        }

        const requiredPerm = actionMap[action];

        if (!requiredPerm) {
            return res.status(400).json({ success: false, message: `Action ${action} tidak terdaftar` });
        }
        const currentPath = req.originalUrl.replace(/\/$/, "");

        const menuMatch = user.permissions.find((p: UserPermission) => {
            if (!p.linkEndpoint) return false;

            const endpoints = p.linkEndpoint.split(',').map(e => e.trim().replace(/\/$/, ""));

            return endpoints.includes(currentPath);
        });

        if (!menuMatch) {
            console.log(`Debug RBAC: Path [${currentPath}] tidak ditemukan di permissions user.`);
            return res.status(403).json({ success: false, message: `Akses ditolak: ${currentPath}` });
        }

        if (!menuMatch.permissions.includes(requiredPerm)) {
            return res.status(403).json({
                success: false,
                message: `Ijin [${requiredPerm}] ditolak`
            });
        }

        next();
    };
};