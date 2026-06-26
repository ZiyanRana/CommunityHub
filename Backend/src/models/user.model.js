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
        trim: true,
        match: [/\S+@\S+\.\S+/, 'Invalid email address entered!'],
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
    },
    profilePhoto: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        maxLength: [150, 'Bio cannot exceed 150 characters!'],
        default: ''
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    postsCount: {
        type: Number,
        default: 0
    },
    followersCount: {
        type: Number,
        default: 0
    },
    followingCount: {
        type: Number,
        default: 0
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

userSchema.index({ createdAt: -1 });
userSchema.index({ username: 'text', email: 'text' });

const userModel = mongoose.model('User', userSchema);

export default userModel;