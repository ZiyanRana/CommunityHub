import mongoose from "mongoose";
import userModel from "../models/user.model.js";
import postModel from "../models/post.model.js";
import sessionModel from "../models/session.model.js";
import likeModel from "../models/like.model.js";
import commentModel from "../models/comment.model.js";
import followModel from "../models/follow.model.js";
import { getImageUrl, deleteFile } from "../services/imageKit.service.js";

export const getAccount = async (req, res) => {
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({ success: false, message: 'Could not find account id, please try again!' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid account id, please try again!' });
    }

    try {
        const account = await userModel.findById({ _id: id }).select('-email -password -verified -isPrivate -active');
        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found!' });
        }

        return res.status(200).json({ success: true, message: 'Account fetched successfully', account });
    } catch (error) {
        console.error('Error fetching account:', error);
        return res.status(500).json({ success: false, message: 'Error fetching account, please try again!' });
    }
}

export const updateAccount = async (req, res) => {
    const { user, mail, newBio } = req.body;
    const profilePhoto = req.file;

    const newUsername = user.trim() || '';
    const newEmail = mail.trim() || '';

    if (!newUsername && !newEmail && !newBio && !profilePhoto) {
        return res.status(400).json({ success: false, message: 'No fields to update!' });
    }

    if (newUsername !== '') {
        if (newUsername.length < 3 || newUsername.length > 20) {
            return res.status(400).json({ success: false, message: 'Username must be between 3-20 characters long!' });
        }
        if (newUsername === req.user.username) {
            return res.status(400).json({ success: false, message: 'Username is the same as before!' });
        }
        
        const existingUser = await userModel.findOne({ username: newUsername });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username is already taken!' });
        }   
    }
         
    if (newEmail !== '') {
        if (!newEmail.match(/\S+@\S+\.\S+/)) {
            return res.status(400).json({ success: false, message: 'Invalid email address entered!' });
        }
        if (newEmail === req.user.email) {
            return res.status(400).json({ success: false, message: 'Email is the same as before!' });
        }
        
        const existingUser = await userModel.findOne({ email: newEmail });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'An account on this email already exists!' });
        }
    }

    let profilePhotoUrl = '';

    try {
        if (profilePhoto) {
            if (!profilePhoto.mimetype.startsWith('image/')) {
                return res.status(400).json({ success: false, message: 'Invalid profile photo, must be an image!' });
            }
            profilePhotoUrl = await getImageUrl(profilePhoto);
        }

        const updatedAccount = await userModel.findOneAndUpdate(
            { _id: req.user._id },
            {
                $set: {
                    username: newUsername ? newUsername : req.user.username,
                    email: newEmail ? newEmail : req.user.email,
                    bio: newBio ? newBio : req.user.bio,
                    profilePhoto: profilePhotoUrl ? profilePhotoUrl : req.user.profilePhoto
                }
            },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Account updated successfully!',
            updatedAccount
        });
    } catch (error) {
        console.error('Error updating account:', error);
        return res.status(400).json({ success: false, message: 'Error updating account!' });
    }
}

export const deactivateAccount = async (req, res) => {
    try {
        const updatedAccount = await userModel.findOneAndUpdate(
            { _id: req.user._id },
            { $set: { active: false } },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Account deactivated successfully!',
            updatedAccount
        });
    } catch (error) {
        console.error('Error deactivating account:', error);
        return res.status(400).json({ success: false, message: 'Error deactivating account, please try again!' }
        )
    }
}

export const deleteAccount = async (req, res) => {
    try {
        const account = await userModel.findOne({ _id: req.user._id });
        if (!account) {
            return res.status(400).json({ success: false, message: 'Account not found!' });
        }

        await postModel.deleteMany({ user: account._id });
        await likeModel.deleteMany({ user: account._id });
        await commentModel.deleteMany({ user: account._id });
        await sessionModel.deleteMany({ user: account._id });
        await followModel.deleteMany({ follower: account._id });
        await followModel.deleteMany({ following: account._id });

        await deleteFile(account.profilePhoto);

        await userModel.deleteOne({ _id: account._id });
        return res.status(200).json({ success: true, message: 'Account deleted successfully!' });
    } catch (error) {
        console.error('Error deleting account:', error);
        return res.status(400).json({ success: false, message: 'Error deleting account, please try again!' });
    }
}

export const toggleAccountPrivacy = async (req, res) => {
    try {
        const privacy = !req.user.isPrivate;

        const updatedAccount = await userModel.findOneAndUpdate(
            { _id: req.user._id },
            { $set: { isPrivate: privacy } },
            { new: true }
        );

        return res.status(200).json({ success: true, message: 'Privacy updated successfully!', updatedAccount });
    } catch (error) {
        console.error('Error toggling account privacy:', error);
        return res.status(400).json({ success: false, message: 'Error changing account privacy, please try again!' });
    }
}