import mongoose from 'mongoose';
import postModel from "../models/post.model.js";
import commentModel from "../models/comment.model.js";

export const commentOnPost = async (req, res) => {
    const { id } = req.params;
    const { comment } = req.body;

    if (!id) {
        return res.status(400).json({ success: false, message: 'Could not find post id, please try again!' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid post id, please try again!' });
    }
    if (!comment) {
        return res.status(400).json({ success: false, message: 'User comment not found!' });
    }

    try {
        const commentedPost = await postModel.findByIdAndUpdate(id, { $inc: { commentCount: 1 } }, { new: true });

        if (!commentedPost) {
            return res.status(404).json({ success: false, message: 'Post not found!' });
        }

        const newComment = await commentModel.create({
            post: id,
            user: req.user._id,
            comment
        });

        return res.status(200).json({ success: true, message: 'Comment added on post successfully', post: commentedPost, comment: newComment });
    }
    catch (error) {
        console.error('Error commenting on the post:', error);
        return res.status(500).json({ success: false, message: 'Error commenting on post, please try again!' });
    }
}

export const editComment = async (req, res) => {
    const { commentId } = req.params.commentId;
    const { comment } = req.body;

    if (!commentId) {
        return res.status(400).json({ success: false, message: 'Could not find comment id, please try again!' });
    }
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return res.status(400).json({ success: false, message: 'Invalid comment id, please try again!' });
    }

    try {
        const commentFound = await commentModel.findById(commentId);

        if (!commentFound) {
            return res.status(404).json({ success: false, message: 'Comment not found!' });
        }
        if (commentFound.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'You are not authorized to edit this comment!' });
        }
        if (!comment) {
            return res.status(400).json({ success: false, message: 'Enter a new comment to edit the previous!' });
        }

        const newComment = await commentModel.findByIdAndUpdate( commentId, { comment, edited: true }, { new: true });

        return res.status(200).json({ success: true, message: 'Comment edited successfully', comment: newComment });
    }
    catch (error) {
        console.error('Error editing the comment:', error);
        return res.status(500).json({ success: false, message: 'Error editing comment, please try again!' });
    }
}

export const deleteComment = async(req, res) => {
    const { commentId } = req.params.commentId;
    const { postId } = req.params.id;

    if (!commentId) {
        return res.status(400).json({ success: false, message: 'Could not find comment id, please try again!' });
    }
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return res.status(400).json({ success: false, message: 'Invalid comment id, please try again!' });
    }

    try {
        const comment = await commentModel.findById(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found!' });
        }

        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'You are not authorized to delete this comment!' });
        }

        await commentModel.findByIdAndDelete(commentId);

        await postModel.findByIdAndUpdate( postId, { $dec: { commentCount: 1 } }, { new: true });

        return res.status(200).json({ success: true, message: 'Comment deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting comment:', error);
        return res.status(500).json({ success: false, message: 'Error deleting comment, please try again!' });
    }
}

export const getPostComments = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: 'Could not find post id, please try again!' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid post id, please try again!' });
    }

    try {
        const post = await postModel.findById(id);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found!' });
        }

        const comments = await commentModel.find({ post: id }).sort({ createdAt: -1 }).limit(20);

        return res.status(200).json({ success: true, message: 'Post comments fetched successfully', comments });
    }
    catch (error) {
        console.error('Error fetching post comments:', error);
        return res.status(500).json({ success: false, message: 'Error fetching post comments, please try again!' });
    }
}