import express from 'express';
import { register, login, logout, logoutAll, refreshTokens, getOtp, verifyOtp } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const authRouter = express.Router();

// Path: /api/v1/auth
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.post('/logout-all', logoutAll);
authRouter.get('/refresh-token', authMiddleware, refreshTokens);
authRouter.get('/get-otp', getOtp);
authRouter.post('/verify-otp', verifyOtp);

export default authRouter;