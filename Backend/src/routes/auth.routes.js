import express from 'express';
import {
    register,
    login,
    logout,
    logoutAll,
    refreshTokens,
    forgotPassword,
    resetPassword
} from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const authRouter = express.Router();

// Path: /api/v1/auth
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', authMiddleware, logout);
authRouter.post('/logout-all', authMiddleware, logoutAll);
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', resetPassword);
authRouter.get('/refresh-token', authMiddleware, refreshTokens);

export default authRouter;
