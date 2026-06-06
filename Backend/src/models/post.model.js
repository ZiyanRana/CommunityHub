import mongoose from 'mongoose';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
dayjs.extend(relativeTime);

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        default: ""
    },
    caption: {
        type: String,
        default: ""
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Post creator is required!']
    },
    tags: {
        type: [String],
        trim: true,
        default: []
    },
    fileUrl: {
        type: String,
        required: [true, 'Post file is required!']
    },
    likeCount: {
        type: Number,
        default: 0
    },
    commentCount: {
        type: Number,
        default: 0
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    location: {
        type: String,
        default: ""
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true } 
});

postSchema.index( { createdAt: -1 } );
postSchema.index( { creator: 1, createdAt: -1 } );

postSchema.index({
    title: 'text',
    caption: 'text',
    tags: 'text',
    location: 'text'
});

postSchema.virtual('postedTimeAgo').get(function () {
    return dayjs(this.createdAt).fromNow();
});

const postModel = mongoose.model('Post', postSchema);

export default postModel;