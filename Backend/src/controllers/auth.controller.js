import userModel from '../models/user.model.js';
import { generateOTP, sendOtpEmail } from '../utils/otp.utils.js';

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

        const newUser = await userModel.create({ username, email, password });

        const otp = generateOTP();
        await sendOtpEmail(otp);

        return res.status(201).json({ success: true, message: 'User added and OTP is sent successfully, use it to verify your account!', user: newUser });
    } 
    catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while registering the user, please try again!' });
    }
}