import userModel from '../models/user.model.js';
import otpModel from '../models/otp.model.js';
import { generateOTP, sendOtpEmail } from '../utils/otp.utils.js';
import crypto from 'crypto';
import { OTP_EXPIRES_IN_MINUTES } from '../config/env.js';

export const getOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'User email is required to send the otp!' });
    }

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: 'Cannot proceed, user with the provided email does not exist!' });
        }

        if (user.verified) {
            return res.status(400).json({ success: false, message: 'User already verified, no need for otp!' });
        }

        await otpModel.deleteMany({ email, purpose: 'verify' });

        const otp = generateOTP();
        const otpHash = await crypto.createHash('sha256').update(otp).digest('hex');

        await otpModel.create({
            user: user._id,
            email,
            otp: otpHash,
            purpose: 'verify',
            expiresAt: new Date(Date.now() + Number(OTP_EXPIRES_IN_MINUTES) * 60 * 1000)
        });

        try {
            await sendOtpEmail(email, otp);
        }
        catch (error) {
            await otpModel.deleteMany({ email, purpose: 'verify' });
            console.error('Error sending otp email:', error);
            return res
                .status(500)
                .json({ success: false, message: 'An error occurred while sending the otp, please try again!' });
        }

        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully!',
            otp: otpHash
        });
    } catch (error) {
        console.error('Error sending otp:', error);
        return res
            .status(500)
            .json({ success: false, message: 'An error occurred while sending the otp, please try again!' });
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
            return res.status(400).json({
                success: false,
                message: 'No user with the provided email exists, check your email and try again!'
            });
        }

        const otpHash = await crypto.createHash('sha256').update(otp).digest('hex');

        const isOtpFound = await otpModel.findOne({
            email,
            otp: otpHash,
            purpose: 'verify'
        });

        if (!isOtpFound) {
            return res
                .status(400)
                .json({ success: false, message: 'Incorrect or expired OTP entered, please try again!' });
        }

        user.verified = true;
        await user.save();

        await otpModel.deleteMany({ email, purpose: 'verify' });

        return res.status(200).json({ success: true, message: 'Account verified successfully!' });
    } catch (error) {
        console.error('Error verifying otp:', error);
        return res
            .status(500)
            .json({ success: false, message: 'An error occurred while verifying the otp, please try again!' });
    }
}