import { Request, Response, NextFunction } from 'express';

export const restrictToInternal = (req: Request, res: Response, next: NextFunction) => {
    const internalKey = (req.headers['x-internal-key'] as string || '').trim();
    const expectedKey = (process.env.INTERNAL_API_KEY || '').trim();
    if (!expectedKey || internalKey !== expectedKey) {
        return res.status(403).json({
            status: 'error',
            message: 'Forbidden: Direct access to RBAC service is not allowed.',
        });
    }
    next();
};