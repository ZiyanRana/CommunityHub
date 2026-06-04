import express from 'express';
import { register, login, logout } from '../controllers/auth.controller.js';

const authRouter = express.Router();

// Path: /api/v1/auth
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);