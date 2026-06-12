import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { followUser, unfollowUser, acceptFollowRequest, rejectFollowRequest, getFollowers, getFollowing, getFollowRequests } from "../controllers/follow.controller.js";

const followRouter = express.Router();

// Path: /api/v1/follow
followRouter.post('/:id', authMiddleware, followUser);
followRouter.delete('/:id', authMiddleware, unfollowUser);
followRouter.patch('/accept/:id', authMiddleware, acceptFollowRequest);
followRouter.delete('/reject/:id', authMiddleware, rejectFollowRequest);
followRouter.get('/followers/:id', authMiddleware, getFollowers);
followRouter.get('/following/:id', authMiddleware, getFollowing);
followRouter.get('/requests', authMiddleware, getFollowRequests);