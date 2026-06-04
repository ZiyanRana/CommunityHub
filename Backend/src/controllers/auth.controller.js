import userModel from '../models/user.model.js';
import otpModel from '../models/otp.model.js';
import sessionModel from '../models/session.model.js';
import { generateOTP, sendOtpEmail } from '../utils/otp.utils.js';
import bcrypt from 'bcryptjs';
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

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await userModel.create({ username, email, password: hashedPassword });

        const to = email;

        const otp = generateOTP();
        await sendOtpEmail(to, otp);

        const otpHash = await bcrypt.hash(otp, salt);

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
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

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

        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

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