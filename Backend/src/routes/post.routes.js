import express from 'express';
import { getPosts, createPost, getSpecificUserPosts, getPost, editPost, getFeed, deletePost } from '../controllers/post.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const postRouter = express.Router();

// Path: /api/v1/posts
postRouter.get('/', authMiddleware, getPosts);
postRouter.post('/', authMiddleware, createPost);
postRouter.get('/:id', authMiddleware, getPost);
postRouter.get('/user/:id', authMiddleware, getSpecificUserPosts);
postRouter.patch('/:id', authMiddleware, editPost);
postRouter.get('/feed', authMiddleware, getFeed);
postRouter.delete('/:id', authMiddleware, deletePost);

export default postRouter;