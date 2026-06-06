import mongoose from 'mongoose';
import postModel from "../models/post.model.js";
import { getImageUrl, getVideoUrl, deleteFile } from "../services/imageKit.service.js";
import paginationValues from '../utils/pagination.utils.js';


export const createPost = async (req, res) => {
    const { title, caption, tags, location } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ success: false, message: 'Post file is required!' });
    }

    if (file.mimeType.startsWith('image/')) {
        const fileUrl = await getImageUrl(file);
        const post = await postModel.create({
            title,
            caption,
            creator: req.user._id,
            tags,
            fileUrl,
            location
        });

        return res.status(201).json({ success: true, message: 'Post created successfully', post });
    }

    if (file.mimeType.startsWith('video/')) {
        const fileUrl = await getVideoUrl(file);
        const post = await postModel.create({
            title,
            caption,
            creator: req.user._id,
            tags,
            fileUrl,
            location
        });

        return res.status(201).json({ success: true, message: 'Post created successfully', post });
    }

    return res.status(400).json({ success: false, message: 'Invalid file type, please try again!' });
}

export const getPosts = async (req, res) => {
    try {
        const { page, limit, skip } = paginationValues(req.query);

        const [posts, totalPosts] = await Promise.all([postModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), postModel.countDocuments()]);
        
        if (totalPosts === 0) {
            return res.status(200).json({
                success: true,
                message: 'There are no posts yet!',
                posts: []
            });
        }

        const totalPages = Math.ceil( totalPosts / limit );

        if (page > totalPages) {
            return res.status(404).json({
                success: false,
                message: 'Page not found!',
                currentPage: page,
                totalPages
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Posts fetched successfully',
            posts,
            pagination: {
                currentPage: page,
                totalPages,
                totalPosts,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } 
    catch (error) {
        console.error('Error fetching posts:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching posts, please try again!',
        });
    }
}

export const getPost = async (req, res) => {
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
            return res.status(404).json({ success: false, message: 'Post with the provided id not found!' });
        }

        return res.status(200).json({ success: true, message: 'Post fetched successfully', post });
    }
    catch (error) {
        console.error('Error fetching post:', error);
        return res.status(500).json({ success: false, message: 'Error fetching post, please try again!' });
    }
}

export const searchPosts = async (req, res) => {
    const  query  = req.query.query?.trim();
    const { page, limit, skip } = paginationValues(req.query);

    if (!query) {
        return res.status(400).json({ success: false, message: 'Search query is required!'});
    }
    if (query.length < 3 || query.length > 50) {
        return res.status(400).json({ success: false, message: 'Search query must be between 3 and 50 characters!'});
    }

    const safeQuery = query.replace(/[<>&]/g, '');
    const textSearch = { $text: { $search: safeQuery } };

    try {
        const [posts, totalPosts] = await Promise.all([postModel.find(textSearch, { score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' }, createdAt: -1 }).skip(skip).limit(limit).lean(), postModel.countDocuments(textSearch)]);

        if (totalPosts === 0) {
            return res.status(200).json({
                success: true,
                message: 'There are no posts with the provided query!',
                posts: []
            });
        }

        const totalPages = Math.ceil( totalPosts / limit );

        if (page > totalPages) {
            return res.status(404).json({
                success: false,
                message: 'Page not found!',
                currentPage: page,
                totalPages
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Posts fetched successfully', 
            posts,
            pagination: {
                currentPage: page,
                totalPages,
                totalPosts,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    }
    catch (error) {
        console.error('Error searching posts:', error);
        return res.status(500).json({ success: false, message: 'Error searching posts, please try again!' });
    }
}

export const editPost = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: 'Could not find post id, please try again!' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid post id, please try again!' });
    }

    const { title, caption, tags, location } = req.body;
    const file = req.file;

    try {
        const post = await postModel.findById(id);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post with the provided id not found!' });
        }

        if (!title && !caption && !tags && !location && !file) {
            return res.status(400).json({ success: false, message: 'Nothing updated by the user!' });
        }

        if (file && file !== post.fileUrl) {
            let fileUrl = '';

            if (file.mimeType.startsWith('image/')) {
                fileUrl = await getImageUrl(file);
            }
            else if (file.mimeType.startsWith('video/')) {
                fileUrl = await getVideoUrl(file);
            }
            else {
                return res.status(400).json({ success: false, message: 'Invalid file type, please try again!' });
            }
            post.fileUrl = fileUrl;
            await post.save();
        }

        const updatedPost = await postModel.findByIdAndUpdate(id, {
            title,
            caption,
            tags,
            location,
            isEdited: true 
        }, { new: true });

        return res.status(200).json({ success: true, message: 'Post updated successfully', post: updatedPost });
    }
    catch (error) 
    {
        console.error('Error updating post:', error);
        return res.status(500).json({ success: false, message: 'Unexpected error occured while updating post, please try again!' });
    }
}

export const deletePost = async (req, res) => {
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

        await deleteFile(post.fileUrl);
        await postModel.findByIdAndDelete(id);

        return res.status(200).json({ success: true, message: 'Post deleted successfully' });
    } 
    catch (error) {
        console.error('Error deleting post:', error);
        return res.status(500).json({ success: false, message: 'Error deleting post, please try again!' });
    }
}