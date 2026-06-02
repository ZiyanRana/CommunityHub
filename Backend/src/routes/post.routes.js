import express from 'express';
import { getPosts, createPost, getPost, updatePost, deletePost } from '../controllers/post.controller.js';

const postRouter = express.Router();

// Path: /api/v1/posts
postRouter.get('/', getPosts);
postRouter.post('/', createPost);
postRouter.get('/:id', getPost);
postRouter.put('/:id', updatePost);
postRouter.delete('/:id', deletePost);

export default postRouter;