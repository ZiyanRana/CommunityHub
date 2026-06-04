/* eslint-disable no-undef */
import { config } from 'dotenv';

config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

export const {
    PORT,
    NODE_ENV,
    MONGODB_URI,
    JWT_SECRET,
    REFRESH_TOKEN_EXPIRES_IN,
    ACCESS_TOKEN_EXPIRES_IN,
    COOKIE_EXPIRES_IN_DAYS,
    GOOGLE_EMAIL,
    CLIENT_ID,
    CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN
} = process.env;