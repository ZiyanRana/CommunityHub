import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { editAccount, deleteAccount, toggleAccountPrivacy } from "../controllers/account.controller.js";

const accountRouter = express.Router();

// Path: /api/v1/account
accountRouter.post('/edit', authMiddleware, editAccount);
accountRouter.delete('/delete', authMiddleware, deleteAccount);
accountRouter.patch('/privacy', authMiddleware, toggleAccountPrivacy);

export default accountRouter;