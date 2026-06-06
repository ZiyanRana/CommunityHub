import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required!']
    },
    post: {
        type: `${mongoose.Schema.Types.ObjectId}`,
        ref: 'Post',
        required: [true, 'Post reference is required!']
    }
}, { timestamps: true });

const likeModel = mongoose.model('Like', likeSchema);

export default likeModel;