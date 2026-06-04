import nodemailer from 'nodemailer';
import { GOOGLE_EMAIL, CLIENT_ID, CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } from '../config/env.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: GOOGLE_EMAIL,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: GOOGLE_REFRESH_TOKEN
    }
});

// eslint-disable-next-line no-unused-vars
transporter.verify( (error, success) => {
    if (error) {
        console.error('Error connecting to email server:', error);
    }
    else {
        console.log('Email server is ready to send messages!');
    }
});

export const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: `CommunityHub <${GOOGLE_EMAIL}>`,
            to,
            subject,
            text,
            html
        });

        console.log('Email sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    catch (error) {
        console.error('Error sending email:', error);
    }
}