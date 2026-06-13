import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required!']
    },
    email: {
        type: String,
        required: [true, 'Email is required!']
    },
    otp: {
        type: String,
        required: [true, 'OTP is required!']
    },
    purpose: {
        type: String,
        enum: ['verify', 'reset'],
        required: [true, 'OTP purpose is required!']
    },
    expiresAt: {
        type: Date,
        required: [true, 'Expiration time is required!'],
        expires: 0
    }
}, { timestamps: true });

const otpModel = mongoose.model('OTP', otpSchema);

export default otpModel;