import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}

export const requireAuth = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    const decoded = verifyToken(token);

    if (!decoded) {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }

    req.user = decoded;
    next();
};