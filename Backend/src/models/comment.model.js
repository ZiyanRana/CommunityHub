import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required!']
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: [true, 'Post reference is required!'],
    },
    comment: {
        type: String,
        required: [true, 'Comment is required!']
    },
    edited: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

commentSchema.index({ createdAt: -1 });

const commentModel = mongoose.model('Comment', commentSchema);

export default commentModel;