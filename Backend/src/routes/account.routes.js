import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getAccount, updateAccount, deactivateAccount, deleteAccount, toggleAccountPrivacy } from "../controllers/account.controller.js";

const accountRouter = express.Router();

// Path: /api/v1/account
accountRouter.get('/:id', authMiddleware, getAccount);
accountRouter.post('/update', authMiddleware, updateAccount);
accountRouter.post('/deactivate', authMiddleware, deactivateAccount);
accountRouter.delete('/delete', authMiddleware, deleteAccount);
accountRouter.patch('/privacy', authMiddleware, toggleAccountPrivacy);

export default accountRouter;