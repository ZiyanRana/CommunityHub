import express from 'express';
import { searchPostsGeneric, searchPostsByTags, searchPostsByLocation, searchAccounts } from '../controllers/search.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const searchRouter = express.Router();

// Path: /api/v1/search
searchRouter.get('/posts', authMiddleware, searchPostsGeneric);
searchRouter.get('/posts/tags', authMiddleware, searchPostsByTags);
searchRouter.get('/posts/location', authMiddleware, searchPostsByLocation);
searchRouter.get('/accounts', authMiddleware, searchAccounts);

export default searchRouter;