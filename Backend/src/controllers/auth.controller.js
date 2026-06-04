import userModel from '../models/user.model.js';
import otpModel from '../models/otp.model.js';
import sessionModel from '../models/session.model.js';
import { generateOTP, sendOtpEmail } from '../utils/otp.utils.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { JWT_SECRET, REFRESH_TOKEN_EXPIRES_IN, ACCESS_TOKEN_EXPIRES_IN, COOKIE_EXPIRES_IN_DAYS, NODE_ENV } from '../config/env.js';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'Some required fields are missing!' });
    } 

    try {
        const existingUser = await userModel.findOne({ $or: [{ username }, { email }] });

        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username or email already exists, login instead!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await userModel.create({ username, email, password: hashedPassword });

        const to = email;

        const otp = generateOTP();
        await sendOtpEmail(to, otp);

        const otpHash = await crypto.createHash('sha256').update(otp).digest('hex');

        await otpModel.create({
            user: newUser._id,
            email,
            otp: otpHash,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });

        return res.status(201).json({ success: true, message: 'User added and OTP is sent successfully, use it to verify your account!', user: newUser });
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
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(400).json({ success: false, message: 'No user is currently signed in!' });
    }

    try {
        // eslint-disable-next-line no-unused-vars
        const decoded = jwt.verify(refreshToken, JWT_SECRET);

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
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(400).json({ success: false, message: 'No user with the provided token is currently signed in!' });
    }

    try {
        const decoded = jwt.verify(refreshToken, JWT_SECRET);
        const sessions = await sessionModel.find(
            { user: decoded.userId, revoked: false }
        );

        if (sessions.length === 0) {
            return res.status(400).json({ success: false, message: 'No user with the provided token is currently signed in!' });
        }

        await sessionModel.updateMany(
            { user: decoded.userId, revoked: false },
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

export const getOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'User email is required to send the otp!' });
    }

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Cannot proceed, user with the provided email does not exist!' });
        }

        if (user.verified) {
            return res.status(400).json({ success: false, message: 'User already verified, no need for otp!' });
        }

        const otp = generateOTP();
        const otpHash = await crypto.createHash('sha256').update(otp).digest('hex');

        await sendOtpEmail(email, otp);

        await otpModel.create({
            user: user._id,
            email,
            otp: otpHash,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });

        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully!',
            otp: otpHash
        });
    }
    catch (error) {
        console.error('Error sending otp:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while sending the otp, please try again!' });
    }
}

export const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'User email is required to verify the account!' });
    }
    if (!otp) {
        return res.status(400).json({ success: false, message: 'OTP is required to verify the user!' });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'No user with the provided email exists, check your email and try again!'});
        }

        const otpHash = await crypto.createHash('sha256').update(otp).digest('hex');

        const isOtpFound = await otpModel.findOne({
            email,
            otp: otpHash
        });

        if (!isOtpFound) {
            return res.status(400).json({ success: false, message: 'Incorrect or expired OTP entered, please try again!' });
        }

        user.verified = true;
        await user.save();

        await otpModel.deleteMany({ email });

        return res.status(200).json({ success: true, message: 'Account verified successfully!' });
    }
    catch (error) {
        console.error('Error verifying otp:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while verifying the otp, please try again!' });
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