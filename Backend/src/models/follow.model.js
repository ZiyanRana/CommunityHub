import mongoose from "mongoose";

const followSchema = new mongoose.Schema({
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Follower reference is required!']
    },
    following: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Following reference is required!']
    },
    status: {
        type: String,
        enum: ['pending', 'accepted'],
        default: 'accepted'
    }
}, { timestamps: true });

const followModel = mongoose.model('Follow', followSchema);

export default followModel;