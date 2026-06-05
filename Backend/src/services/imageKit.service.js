import ImageKit from "@imagekit/nodejs";
import { IMAGE_KIT_KEY } from "../config/env.js";
import path from "path";

const imageKit = new ImageKit({
    privateKey: IMAGE_KIT_KEY
});

export const getImageUrl = async (file) => {
    try {
        const extension = path.extname(file.originalname);
        const response = await imageKit.files.upload({
            file: file.buffer.toString('base64'),
            fileName: `post_file_${Date.now()}${extension}`,
            folder: 'posts/images'
        });
        return response.url;
    }
    catch (error) {
        console.error('Error uploading image:', error);
        const err = new Error('Failed to upload image, please try again!');
        err.status = 500;
        throw err;
    }
}

export const getVideoUrl = async (file) => {
    try {
        const extension = path.extname(file.originalname);
        const response = await imageKit.files.upload({
            file: file.buffer.toString('base64'),
            fileName: `post_file_${Date.now()}${extension}`,
            folder: 'posts/videos'
        });
        return response.url;
    }
    catch (error) {
        console.error('Error uploading video:', error);
        const err = new Error('Failed to upload video, please try again!');
        err.status = 500;
        throw err;
    }
}

export const deleteFile = async (file) => {
    try {
        const fileId = path.basename(file, path.extname(file));
        await imageKit.files.deleteFile(fileId);
    }
    catch (error) {
        console.error('Error deleting file:', error);
        const err = new Error('Failed to delete file, please try again!');
        err.status = 500;
        throw err;
    }
}