import express from 'express';
import { likePost, unlikePost } from '../controllers/like.controller.js';

const likeRouter = express.Router();

// Path: /api/v1/likes
likeRouter.post('/:id', likePost);
likeRouter.delete('/:id', unlikePost);

export default likeRouter;