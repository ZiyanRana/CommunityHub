import mongoose from 'mongoose';
import { MONGODB_URI } from '../config/env.js';

const connectDB = async () => {
    if (!MONGODB_URI) {
        console.error('MongoDB URI is not defined in environment variables');
    }

    try {
        await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('MongoDB connected successfully');
    } 
    catch (error) {
        console.error('Error connecting to MongoDB:', error);
        // eslint-disable-next-line no-undef
        process.exit(1);
    }
}

export default connectDB;