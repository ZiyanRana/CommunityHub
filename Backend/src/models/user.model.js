import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required!'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long!'],
        maxlength: [20, 'Username cannot exceed 20 characters!'],
        index: true
    },
    email: {
        type: String,
        required: [true, 'Email is required!'],
        unique: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'Invalid email address entered!'],
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: [true, 'Password is required!'],
        minlength: [8, 'Password must be at least 8 characters long!']
    },
    verified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const userModel = mongoose.model('User', userSchema);

export default userModel;