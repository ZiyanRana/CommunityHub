import postModel from "../models/post.model.js";
import mongoose from 'mongoose';

export const getPosts = async (req, res) => {
    try {
        const posts = await postModel.find().limit(20).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: 'Posts fetched successfully',
            posts
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching posts, please try again!',
        });
    }
}

export const createPost = async (req, res) => {
    res.send('Create Post');
}

export const getPost = async (req, res) => {
    const { id: _id } = req.params;

    if (!_id) {
        return res.status(400).json({ success: false, message: 'Could not find post id, please try again!' });
    }
    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(400).json({ success: false, message: 'Invalid post id, please try again!' });
    }

    try {
        const post = await postModel.findById(_id);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found!' });
        }

        return res.status(200).json({ success: true, message: 'Post fetched successfully', post });
    }
    catch (error) {
        console.error('Error fetching post:', error);
        return res.status(500).json({ success: false, message: 'Error fetching post, please try again!' });
    }
}

export const updatePost = async (req, res) => {
    res.send('Update post');
}

export const deletePost = async (req, res) => {
    const { id: _id } = req.params;

    if (!_id) {
        return res.status(400).json({ success: false, message: 'Could not find post id, please try again!' });
    }
    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(400).json({ success: false, message: 'Invalid post id, please try again!' });
    }

    try {
        const post = await postModel.findByIdAndDelete(_id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found!' });
        }

        return res.status(200).json({ success: true, message: 'Post deleted successfully' });
    } 
    catch (error) {
        console.error('Error deleting post:', error);
        return res.status(500).json({ success: false, message: 'Error deleting post, please try again!' });
    }
}