import { sendEmail } from '../services/nodemailer.service.js';

export const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString(); 
}

export const sendOtpEmail = (to, otp) => {
    const subject = 'Your CommunityHub Account Verification Code';

    const text = `
Your verification code is: ${otp}

This code will expire in 10 minutes.

If you did not request this code, please ignore this email.
`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2>Email Verification</h2>

            <p>Hello,</p>

            <p>Thank you for signing up. Please use the verification code below to verify your email address:</p>

            <div style="
                background-color: #f4f4f4;
                padding: 16px;
                text-align: center;
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 6px;
                border-radius: 8px;
                margin: 24px 0;
            ">
                ${otp}
            </div>

            <p>This code will expire in <strong>10 minutes</strong>.</p>

            <p>If you did not request this verification code, you can safely ignore this email.</p>

            <br />

            <p>Best regards,</p>
            <p><strong>Your App Team</strong></p>
        </div>
        `;

    sendEmail(to, subject, text, html);
};