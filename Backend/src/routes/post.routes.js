import express from 'express';
import { getPosts, createPost, getPost, editPost, deletePost } from '../controllers/post.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const postRouter = express.Router();

// Path: /api/v1/posts
postRouter.get('/', authMiddleware, getPosts);
postRouter.post('/', authMiddleware, createPost);
postRouter.get('/:id', authMiddleware, getPost);
postRouter.put('/:id', authMiddleware, editPost);
postRouter.delete('/:id', authMiddleware, deletePost);

export default postRouter;