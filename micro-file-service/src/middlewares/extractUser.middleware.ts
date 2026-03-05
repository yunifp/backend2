import { Request, Response, NextFunction } from 'express';

export const extractUserFromHeader = (req: Request, res: Response, next: NextFunction) => {
    const userData = req.headers['x-user-data'];

    if (!userData) {
        return res.status(401).json({ success: false, message: "Unauthorized: No user data from gateway" });
    }

    try {
        // Parse kembali string JSON dari header ke objek
        req.user = JSON.parse(userData as string);
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Unauthorized: Invalid user data format" });
    }
};