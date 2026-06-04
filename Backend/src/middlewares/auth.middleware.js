import userModel from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';

export const authMiddleware = async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken || req.headers.authentication?.split(' ')[1];

    if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Unauthorized, no token provided!' });
    }

    try {
        const decoded = jwt.verify(refreshToken, JWT_SECRET);
        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized, user with the provided token not found!' });
        }

        req.user = user;
        return next();
    }
    catch (error) {
        console.error('Error verifying token:', error);
        return res.status(401).json({ success: false, message: 'Unauthorized, invalid token!' });
    }
}