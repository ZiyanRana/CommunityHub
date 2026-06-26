import mongoose from 'mongoose';
import userModel from '../models/user.model.js';
import postModel from '../models/post.model.js';
import { getImageUrl, getVideoUrl, deleteFile } from '../services/imageKit.service.js';
import paginationValues from '../utils/pagination.utils.js';

export const createPost = async (req, res) => {
    const { title, caption, tags, location } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ success: false, message: 'Post file is required!' });
    }

    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');

    if (!isImage && !isVideo) {
        return res.status(400).json({ success: false, message: 'Invalid file type, please try again!' });
    }

    const normalizedTags = tags?.map((tag) => tag.trim().toLowerCase().replace(/[<>&]/g, ''));

    const session = await mongoose.startSession();

    try {
        session.startTransaction();
        const fileUrl = isImage ? await getImageUrl(file) : await getVideoUrl(file);

        const post = await postModel.create({
            title,
            caption,
            creator: req.user._id,
            tags: normalizedTags,
            fileUrl,
            location
        }, { session });
            
        await userModel.findByIdAndUpdate(req.user._id, { $inc: { postsCount: 1 } }, { session });
        await session.commitTransaction();

        return res.status(201).json({ success: true, message: 'Post created successfully', post: post[0] });
    }
    catch (error) {
        await session.abortTransaction();
        console.error('Error creating post:', error);
        return res.status(500).json({ success: false, message: 'Error creating post, please try again!' });
    }
    finally {
        await session.endSession();
    }
};

export const getPosts = async (req, res) => {
    const { page, limit, skip } = paginationValues(req.query);

    try {
        const [posts, totalPosts] = await Promise.all([
            postModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            postModel.countDocuments()
        ]);

        if (totalPosts === 0) {
            return res.status(200).json({
                success: true,
                message: 'There are no posts yet!',
                posts: []
            });
        }

        const totalPages = Math.ceil(totalPosts / limit);

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
    } catch (error) {
        console.error('Error fetching posts:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching posts, please try again!'
        });
    }
};

export const getPost = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            success: false,
            message: 'Could not find post id, please try again!'
        });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid post id, please try again!' });
    }

    try {
        const post = await postModel.findById(id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post with the provided id not found!'
            });
        }

        return res.status(200).json({ success: true, message: 'Post fetched successfully', post });
    } catch (error) {
        console.error('Error fetching post:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching post, please try again!'
        });
    }
};

export const getSpecificUserPosts = async (req, res) => {
    const id = req.params;
    const { page, limit, skip } = paginationValues(req.query);

    if (!id) {
        return res.status(400).json({
            success: false,
            message: 'Could not find user id, please try again!'
        });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid user id, please try again!' });
    }

    try {
        const [posts, totalPosts] = await Promise.all([
            postModel.find({ creator: id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            postModel.countDocuments({ creator: id })
        ]);

        if (totalPosts === 0) {
            return res.status(200).json({
                success: true,
                message: 'There are no posts of this user yet!',
                posts: []
            });
        }

        const totalPages = Math.ceil(totalPosts / limit);

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
    } catch (error) {
        console.error('Error fetching posts:', error);
        return res.status(500).json({
            success: false,
            message: "Error fetching user's posts, please try again!"
        });
    }
};

export const editPost = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            success: false,
            message: 'Could not find post id, please try again!'
        });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid post id, please try again!' });
    }

    const { title, caption, tags, location } = req.body;
    const file = req.file;

    try {
        const post = await postModel.findById(id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post with the provided id not found!'
            });
        }

        if (post.creator.toString() !== req.user.toString()) {
            return res
                .status(403)
                .json({ success: false, message: 'The post is not yours, you are not authorized to edit it!' });
        }

        if (!title && !caption && !tags && !location && !file) {
            return res.status(400).json({ success: false, message: 'Nothing updated by the user!' });
        }

        if (file && file !== post.fileUrl) {
            let fileUrl = '';

            if (file.mimetype.startsWith('image/')) {
                fileUrl = await getImageUrl(file);
            } else if (file.mimetype.startsWith('video/')) {
                fileUrl = await getVideoUrl(file);
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file type, please try again!'
                });
            }
            post.fileUrl = fileUrl;
            await post.save();
        }

        const updatedPost = await postModel.findByIdAndUpdate(
            id,
            {
                title,
                caption,
                tags,
                location,
                isEdited: true
            },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Post updated successfully',
            post: updatedPost
        });
    } catch (error) {
        console.error('Error updating post:', error);
        return res.status(500).json({
            success: false,
            message: 'Unexpected error occured while updating post, please try again!'
        });
    }
};

export const deletePost = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            success: false,
            message: 'Could not find post id, please try again!'
        });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid post id, please try again!' });
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const post = await postModel.findById(id).session(session);
        if (!post) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Post not found!' });
        }

        if (post.creator.toString() !== req.user._id.toString()) {
            await session.abortTransaction();
            return res
                .status(403)
                .json({ success: false, message: 'The post is not yours, you are not authorized to delete it!' });
        }

        await postModel.findByIdAndDelete(id).session(session);
        await userModel.findByIdAndUpdate(
            req.user._id,
            { $inc: { postsCount: -1 } },
            { session }
        );

        await session.commitTransaction();

        try {
            await deleteFile(post.fileUrl);
        } catch (fileError) {
            console.error('Post deleted from DB but failed to delete file:', post.fileUrl, fileError);
        }

        return res.status(200).json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        await session.abortTransaction();
        console.error('Error deleting post:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting post, please try again!'
        });
    } finally {
        await session.endSession();
    }
};
