import express from 'express';
import { getPostComments, commentOnPost, deleteComment, editComment } from '../controllers/comment.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const commentRouter = express.Router();

// Path: /api/v1/comments
commentRouter.get('/:id', authMiddleware, getPostComments);
commentRouter.post('/:id', authMiddleware, commentOnPost);
commentRouter.patch('/:id/:commentId', authMiddleware, editComment);
commentRouter.delete('/:id/:commentId', authMiddleware, deleteComment);

export default commentRouter;