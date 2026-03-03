import { Request, Response, NextFunction } from 'express';

export const validateAppId = (req: Request, res: Response, next: NextFunction) => {
    const appId = req.headers['x-app-id'];

    if (!appId || appId !== process.env.FRONTEND_APP_ID) {
        return res.status(401).json({ message: 'Unauthorized: Invalid App ID' });
    }
    next();
};