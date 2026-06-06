import express from 'express';
import { getPosts, createPost, searchPosts, getPost, editPost, deletePost } from '../controllers/post.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const postRouter = express.Router();

// Path: /api/v1/posts
postRouter.get('/', authMiddleware, getPosts);
postRouter.post('/', authMiddleware, createPost);
postRouter.get('/search', authMiddleware, searchPosts);
postRouter.get('/:id', authMiddleware, getPost);
postRouter.patch('/:id', authMiddleware, editPost);
postRouter.delete('/:id', authMiddleware, deletePost);

export default postRouter;