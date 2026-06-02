import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Post title is required!'],
        minlength: [5, 'Post title must be at least 5 characters long!'],
        maxlength: [50, 'Post title cannot exceed 50 characters!']
    },
    caption: {
        type: String,
        default: 'No Caption'
    },
    creator: {
        type: String,
        required: [true, 'Post creator is required!']
    },
    tags: {
        type: [String],
        default: []
    },
    postFile: {
        type: String,
    },
    likeCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const postModel = mongoose.model('Post', postSchema);

export default postModel;