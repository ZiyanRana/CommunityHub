import postModel from '../models/post.model.js';
import userModel from '../models/user.model.js';
import paginationValues from '../utils/pagination.utils.js';

export const searchPostsGeneric = async (req, res) => {
    const query = req.query.query?.trim();
    const { page, limit, skip } = paginationValues(req.query);

    if (!query) {
        return res.status(400).json({ success: false, message: 'Search query is required!' });
    }
    if (query.length < 3 || query.length > 50) {
        return res.status(400).json({
            success: false,
            message: 'Search query must be between 3 and 50 characters!'
        });
    }

    const safeQuery = query.replace(/[<>&]/g, '');
    const textSearch = { $text: { $search: safeQuery } };

    try {
        const [posts, totalPosts] = await Promise.all([
            postModel
                .find(textSearch, { score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            postModel.find(textSearch).countDocuments()
        ]);

        if (totalPosts === 0) {
            return res.status(200).json({
                success: true,
                message: 'There are no posts with the provided query!',
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
        console.error('Error searching posts:', error);
        return res.status(500).json({
            success: false,
            message: 'Error searching posts, please try again!'
        });
    }
};

export const searchPostsByTags = async (req, res) => {
    const query = req.query.query?.trim();
    const { page, limit, skip } = paginationValues(req.query);

    if (!query) {
        return res.status(400).json({ success: false, message: 'Search query is required!' });
    }
    if (query.length < 3 || query.length > 50) {
        return res.status(400).json({
            success: false,
            message: 'Search query must be between 3 and 50 characters!'
        });
    }

    const safeQuery = query.toLowerCase().replace(/[<>&]/g, '');

    const tagFilter = { tags: safeQuery };

    try {
        const [posts, totalPosts] = await Promise.all([
            postModel.find(tagFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            postModel.countDocuments(tagFilter)
        ]);

        if (totalPosts === 0) {
            return res.status(200).json({
                success: true,
                message: 'There are no posts with the provided tag!',
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
        console.error('Error searching posts by tag:', error);
        return res.status(500).json({
            success: false,
            message: 'Error searching posts by tags, please try again!'
        });
    }
};

export const searchPostsByLocation = async (req, res) => {
    const query = req.query.query?.trim();
    const { page, limit, skip } = paginationValues(req.query);

    if (!query) {
        return res.status(400).json({ success: false, message: 'Search query is required!' });
    }
    if (query.length < 3 || query.length > 50) {
        return res.status(400).json({
            success: false,
            message: 'Search query must be between 3 and 50 characters!'
        });
    }

    const safeQuery = query.ToLowerCase.replace(/[<>&]/g, '');
    const locationFilter = { location: safeQuery };

    try {
        const [posts, totalPosts] = await Promise.all([
            postModel.find(locationFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            postModel.countDocuments(locationFilter)
        ]);

        if (totalPosts === 0) {
            return res.status(200).json({
                success: true,
                message: 'There are no posts with the provided location!',
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
        console.error('Error searching posts by location:', error);
        return res.status(500).json({
            success: false,
            message: 'Error searching posts by location, please try again!'
        });
    }
};

export const searchAccounts = async (req, res) => {
    const query = req.query.query?.trim();

    if (!query) {
        return res.status(400).json({ success: false, message: 'Search query is required!' });
    }
    if (query.length < 3 || query.length > 50) {
        return res.status(400).json({
            success: false,
            message: 'Search query must be between 3 and 50 characters!'
        });
    }

    const { page, limit, skip } = paginationValues(req.query);

    try {
        const [users, totalUsers] = await Promise.all([
            userModel
                .find({ $text: { $search: query }, score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            userModel.find({ $text: { $search: query } }).countDocuments()
        ]);

        if (totalUsers === 0) {
            return res.status(200).json({
                success: true,
                message: 'There are no users with the provided username or email!',
                users: []
            });
        }

        const totalPages = Math.ceil(totalUsers / limit);

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
            message: 'Users fetched successfully',
            users,
            pagination: {
                currentPage: page,
                totalPages,
                totalUsers,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Error searching users:', error);
        return res.status(500).json({
            success: false,
            message: 'Error searching users, please try again!'
        });
    }
};