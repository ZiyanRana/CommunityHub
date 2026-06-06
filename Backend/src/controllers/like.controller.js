import mongoose from "mongoose";
import likeModel from "../models/like.model.js";
import postModel from "../models/post.model.js";

export const likePost = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: 'Could not find post, please try again!' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid post id, please try again!' });
    }

    try {
        const likedPost = await likeModel.findOne({ user: req.user._id, post: id });
        if (likedPost) {
            return res.status(200).json({ success: true, message: 'Post already liked', post: likedPost });
        }

        const likePost = await likeModel.create({ user: req.user._id, post: id });

        await postModel.findByIdAndUpdate(id, { $inc: { likeCount: 1 } }, { new: true });

        return res.status(200).json({ success: true, message: 'Post liked successfully', post: likePost });
    }
    catch (error) {
        console.error('Error liking the post:', error);
        return res.status(500).json({ success: false, message: 'Error liking post, please try again!' });
    }
}

export const unlikePost = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: 'Could not find the post, please try again!' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid post id, please try again!' });
    }

    try {
        const unlikedPost = await likeModel.findOneAndDelete({ user: req.user._id, post: id });

        if (!unlikedPost) {
            return res.status(404).json({ success: false, message: 'Cannot unlike as post was not liked by the user!' });
        }

        await postModel.findByIdAndUpdate(id, { $dec: { likeCount: 1 } }, { new: true });

        return res.status(200).json({ success: true, message: 'Post unliked successfully', post: unlikedPost });
    }
    catch (error) {
        console.error('Error unliking the post:', error);
        return res.status(500).json({ success: false, message: 'Error unliking post, please try again!' });
    }
}