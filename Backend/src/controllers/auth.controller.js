import userModel from '../models/user.model.js';
import otpModel from '../models/otp.model.js';
import sessionModel from '../models/session.model.js';
import { generateOTP, sendOtpEmail } from '../utils/otp.utils.js';
import { getImageUrl } from '../services/imageKit.service.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { JWT_SECRET, REFRESH_TOKEN_EXPIRES_IN, ACCESS_TOKEN_EXPIRES_IN, COOKIE_EXPIRES_IN_DAYS, NODE_ENV, OTP_EXPIRES_IN_MINUTES } from '../config/env.js';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
    const { username, email, password, bio, isPrivate } = req.body;
    const profilePhoto = req.file;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'Some required fields are missing!' });
    }

    let profilePhotoUrl = '';

    try {
        if (profilePhoto) {
            if (!profilePhoto.mimetype.startsWith('image/')) {
                return res.status(400).json({ success: false, message: 'Invalid profile photo, must be an image!' });
            }
            profilePhotoUrl = await getImageUrl(profilePhoto);
        }

        const existingUser = await userModel.findOne({ $or: [{ username }, { email }] });

        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username or email already exists, login instead!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await userModel.create({
            username,
            email,
            password: hashedPassword,
            profilePhoto: profilePhotoUrl,
            bio: bio? bio : '',
            isPrivate: isPrivate? true : false
        });

        const otp = generateOTP();

        try {
            await sendOtpEmail(email, otp);
        } catch (error) {
            await userModel.deleteOne({ _id: newUser._id });
            console.error('Error sending OTP email:', error);
            return res.status(500).json({ success: false, message: 'An error occurred while sending the OTP email, please try again!' });
        }

        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

        await otpModel.create({
            user: newUser._id,
            email,
            otp: otpHash,
            purpose: 'verify',
            expiresAt: new Date(Date.now() + Number(OTP_EXPIRES_IN_MINUTES) * 60 * 1000)
        });

        return res.status(201).json({ success: true, message: 'User added and OTP is sent successfully, use it to verify your account!' });
    }
    catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while registering the user, please try again!' });
    }
}

export const login = async (req, res) => {
    const { username, email, password } = req.body;

    if ((!username && !email) || !password) {
        return res.status(400).json({ success: false, message: 'Some required fields are missing!' });
    }

    try {
        const user = await userModel.findOne({ $or: [{ username }, { email }] });

        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found!' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: 'Password is incorrect!' });
        }

        if (!user.verified) {
            return res.status(400).json({ success: false, message: 'Account not verified, please verify your account first!' });
        }
        if (!user.active) {
            user.active = true;
            await user.save();
        }

        const refreshToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
        const refreshTokenHash = await crypto.CreateHash('sha256').update(refreshToken).digest('hex');

        const session = await sessionModel.create({
            user: user._id,
            refreshToken: refreshTokenHash,
            ip: req.ip,
            userAgent: req.headers['user-agent'] || 'Unknown'
        });

        const accessToken = jwt.sign({ userId: user._id, sessionId: session._id }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });

        const cookieMaxAge = Number(COOKIE_EXPIRES_IN_DAYS) * 24 * 60 * 60 * 1000;

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: cookieMaxAge,
            path: '/'
        });

        return res.status(200).json({
            success: true,
            message: 'User logged in successfully!',
            user: {
                username: user.username,
                email: user.email
            },
            token: accessToken
        });
    }
    catch (error) {
        console.error('Error logging in user:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while logging the user in, please try again!' });
    }
}

export const logout = async (req, res) => {
    const refreshToken = req.refreshToken;

    try {
        const refreshTokenHash = await crypto.createHash('sha256').update(refreshToken).digest('hex');

        const session = await sessionModel.findOne({ refreshToken: refreshTokenHash, revoked: false });

        if (!session) {
            return res.status(400).json({ success: false, message: 'User is not currently signed in their account!' });
        }
        
        session.revoked = true;
        await session.save();

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/'
        });

        return res.status(200).json({ success: true, message: 'User logged out successfully!' });
    }
    catch (error) {
        console.error('Error logging out user:', error);
        return res.status(400).json({ success: false, message: 'Invalid token provided!' });
    }
}

export const logoutAll = async (req, res) => {
    const user = req.user;
    
    try {
        const sessions = await sessionModel.find(
            { user: user._id, revoked: false }
        );

        if (sessions.length === 0) {
            return res.status(400).json({ success: false, message: 'No user with the provided token is currently signed in!' });
        }

        await sessionModel.updateMany(
            { user: user._id, revoked: false },
            { revoked: true }
        );

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/'
        });

        return res.status(200).json({ success: true, message: 'All user instances logged out successfully!' });
    }
    catch (error) {
        console.error('Error verifying token:', error);
        return res.status(400).json({ success: false, message: 'Invalid token provided!' });
    }
}

export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'User email is required to reset the password!' });
    }

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: 'Cannot proceed, user with the provided email does not exist!' });
        }

        await otpModel.deleteMany({ email, purpose: 'reset' });

        const otp = generateOTP();

        try {
            await sendOtpEmail(email, otp);
        }
        catch (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ success: false, message: 'An error occurred while sending the OTP email, please try again!' });
        }

        const otpHash = await crypto.createHash('sha256').update(otp).digest('hex');

        await otpModel.create({
            user: user._id,
            email,
            otp: otpHash,
            purpose: 'reset',
            expiresAt: new Date(Date.now() + Number(OTP_EXPIRES_IN_MINUTES) * 60 * 1000)
        });

        return res.status(200).json({ success: true, message: 'OTP to reset password has been sent successfully!' });
    } catch (error) {
        console.error('Error in forgot password:', error);
        return res.status(500).json({ success: false, message: 'An error occurred, please try again!' });
    }
}

export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: 'User email, OTP and new password are required to reset the password!' });
    }

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: 'Cannot proceed, user with the provided email does not exist!' });
        }

        const otpHash = await crypto.createHash('sha256').update(otp).digest('hex');

        const isOtpFound = await otpModel.findOne({
            email,
            otp: otpHash,
            purpose: 'reset'
        });

        if (!isOtpFound) {
            return res
                .status(400)
                .json({ success: false, message: 'Cannot proceed, invalid OTP provided!' });
        }

        await otpModel.deleteMany({ email, purpose: 'reset' });

        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        if (newPasswordHash === user.password) {
            return res.status(400).json({ success: false, message: 'New password cannot be the same as the old password!' });
        }

        user.password = newPasswordHash;
        await user.save();

        await sessionModel.updateMany({
            user: user._id,
            revoked: false
        }, {
            revoked: true
        });

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/'
        });

        return res.status(200).json({ success: true, message: 'Password reset successfully, login with the new password!' });
    }
    catch (error) {
        console.error('Error in reset password:', error);
        return res.status(500).json({ success: false, message: 'An error occurred, please try again!' });
    }
}

export const refreshTokens = async (req, res) => {
    const refreshToken = req.refreshToken;

    try {
        const refreshTokenHash = await crypto.createHash('sha256').update(refreshToken).digest('hex');
        const session = await sessionModel.findOne({ refreshToken: refreshTokenHash, revoke: false });

        if (!session) {
            return res.status(401).json({ success: false, message: 'Cannot proceed, user is not currently logged in!' });
        }

        const newRefreshToken = jwt.sign({ userId: session.user }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
        const newRefreshTokenHash = await crypto.createHash('sha256').update(newRefreshToken).digest('hex');

        session.refreshToken = newRefreshTokenHash;
        await session.save();

        const accessToken = jwt.sign({ userId: session.user, sessionId: session._id }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });

        const cookieExpiresIn = Number(COOKIE_EXPIRES_IN_DAYS) * 24 * 60 * 60 * 1000;
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/',
            expires: new Date(Date.now() + cookieExpiresIn)
        });

        return res.status(200).json({
            success: true,
            message: 'Tokens refreshed successfully!',
            accessToken
        });
    }
    catch (error) {
        console.error('Error refreshing tokens:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while refreshing the tokens, please try again!' });
    }
}