/* eslint-disable no-undef */
import { config } from 'dotenv';

config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

export const {
    PORT,
    NODE_ENV,
    MONGODB_URI
} = process.env;