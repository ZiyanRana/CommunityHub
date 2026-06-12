import express from "express";
import { getOtp, verifyOtp } from "../controllers/otp.controller.js";

const otpRouter = express.Router();

// Path: /api/v1/otp
otpRouter.get('/', getOtp);
otpRouter.post('/', verifyOtp);

export default otpRouter;