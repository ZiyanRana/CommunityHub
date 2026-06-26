import mongoose from 'mongoose';
import followModel from '../models/follow.model.js';
import { paginationValues } from '../utils/pagination.utils.js';

export const followUser = async (req, res) => {
    const { followingAccountId } = req.params.id;

    if (!followingAccountId) {
        return res.status(400).json({ success: false, message: 'Could not find user id, please try again!' });
    }
    if (!mongoose.Types.ObjectId.isValid(followingAccountId)) {
        return res.status(400).json({ success: false, message: 'Invalid user id, please try again!' });
    }

    try {
        const follow = await followModel.create({
            follower: req.user._id,
            following: followingAccountId,
            status: followingAccountId.isPrivate === true ? 'pending' : 'accepted'
        });

        if (followingAccountId.isPrivate === true) {
            return res.status(200).json({ success: true, message: 'Follow request sent successfully!', follow });
        }

        return res.status(200).json({ success: true, message: '', follow });
    } catch (error) {
        console.error('Error following user:', error);
        return res.status(400).json({ success: false, message: 'Error following user, please try again!' });
    }
}

export const unfollowUser = async (req, res) => {
    const { followingAccountId } = req.params.id;

    if (!followingAccountId) {
        return res.status(400).json({ success: false, message: 'Could not find user id, please try again!' });
    }
    if (!mongoose.Types.ObjectId.isValid(followingAccountId)) {
        return res.status(400).json({ success: false, message: 'Invalid user id, please try again!' });
    }

    try {
        const follow = await followModel.findOneAndDelete({
            follower: req.user._id,
            following: followingAccountId,
            status: 'accepted'
        });
        if (!follow) {
            return res.status(400).json({ success: false, message: 'You are not following this user!' });
        }

        return res.status(200).json({ success: true, message: 'User unfollowed successfully!', follow });
    } catch (error) {
        console.error('Error unfollowing user:', error);
        return res.status(400).json({ success: false, message: 'Error unfollowing user, please try again!' });
    }
}

export const acceptFollowRequest = async (req, res) => {
    const { requestingAccountId } = req.params.id;

    if (!requestingAccountId) {
        return res.status(400).json({ success: false, message: 'Could not find user id, please try again!' });
    }
    if (!mongoose.Types.ObjectId.isValid(requestingAccountId)) {
        return res.status(400).json({ success: false, message: 'Invalid user id, please try again!' });
    }

    try {
        const updatedFollow = await followModel.findOneAndUpdate(
            { follower: requestingAccountId, following: req.user._id, status: 'pending' },
            { status: 'accepted' },
            { new: true }
        );
        if (!updatedFollow) {
            return res.status(400).json({ success: false, message: 'Follow request not found!' });
        }

        return res.status(200).json({ success: true, message: 'Follow request accepted successfully!', updatedFollow });
    } catch (error) {
        console.error('Error accepting follow request:', error);
        return res
            .status(400)
            .json({ success: false, message: 'Error accepting the follow request, please try again!' });
    }
}

export const declineFollowRequest = async (req, res) => {
    const { requestingAccountId } = req.params.id;

    if (!requestingAccountId) {
        return res.status(400).json({ success: false, message: 'Could not find user id, please try again!' });
    }
    if (!mongoose.Types.ObjectId.isValid(requestingAccountId)) {
        return res.status(400).json({ success: false, message: 'Invalid user id, please try again!' });
    }

    try {
        const updatedFollow = await followModel.findOneAndDelete({
            follower: requestingAccountId,
            following: req.user._id,
            status: 'pending'
        });
        if (!updatedFollow) {
            return res.status(400).json({ success: false, message: 'Follow request not found!' });
        }

        return res.status(200).json({
            success: true,
            message: 'Follow request declined successfully!',
            request: {
                follower: requestingAccountId,
                following: req.user._id,
                status: 'declined'
            }
        });
    } catch (error) {
        console.error('Error declining follow request:', error);
        return res
            .status(400)
            .json({ success: false, message: 'Error declining the follow request, please try again!' });
    }
}

export const getFollowers = async (req, res) => {
    const { id } = req.params.id;
    const { page, limit, skip } = paginationValues(req.query);

    if (!id) {
        return res.status(400).json({ success: false, message: 'Could not find user id, please try again!' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid user id, please try again!' });
    }

    try {
        const [followers, totalFollowers] = await Promise.all([followModel.find({ following: id, status: 'accepted' }).select('follower').sort({ createdAt: -1 }).skip(skip).limit(limit).lean()], followModel.countDocuments({ following: id, status: 'accepted' }));
        
        if (totalFollowers === 0) {
            return res.status(200).json({ success: true, message: 'No followers of this account yet!', followers: [] });
        }

        const totalPages = Math.ceil(totalFollowers / limit);

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
            message: 'Followers fetched successfully',
            followers,
            pagination: {
                currentPage: page,
                totalPages,
                totalFollowers,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching followers:', error);
        return res.status(500).json({ success: false, message: 'Error fetching followers, please try again!' });
    }
}

export const getFollowing = async (req, res) => {
    const { id } = req.params.id;
    const { page, limit, skip } = paginationValues(req.query);

    if (!id) {
        return res.status(400).json({ success: false, message: 'Could not find user id, please try again!' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid user id, please try again!' });
    }

    try {
        const [following, totalFollowing] = await Promise.all([followModel.find({ follower: id, status: 'accepted' }).select('following').sort({ createdAt: -1 }).skip(skip).limit(limit).lean()], followModel.countDocuments({ follower: id, status: 'accepted' }));
        
        if (totalFollowing === 0) {
            return res.status(200).json({ success: true, message: 'No followers of this account yet!', followers: [] });
        }

        const totalPages = Math.ceil(totalFollowing / limit);

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
            message: 'Followers fetched successfully',
            following,
            pagination: {
                currentPage: page,
                totalPages,
                totalFollowing,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching following:', error);
        return res.status(500).json({ success: false, message: 'Error fetching following, please try again!' });
    }
}

export const getFollowRequests = async (req, res) => {
    const { page, limit, skip } = paginationValues(req.query);

    try {
        const [followRequests, totalRequests] = await Promise.all([followModel.find({ following: req.user._id, status: 'pending' }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()], followModel.countDocuments({ following: req.user._id, status: 'pending' }));
        
        if (totalRequests === 0) {
            return res.status(200).json({ success: true, message: 'No follow requests yet!', followRequests: [] });
        }

        const totalPages = Math.ceil(totalRequests / limit);

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
            message: 'Follow requests fetched successfully',
            followRequests,
            pagination: {
                currentPage: page,
                totalPages,
                totalRequests,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching follow requests:', error);
        return res.status(500).json({ success: false, message: 'Error fetching follow requests, please try again!' });
    }
}