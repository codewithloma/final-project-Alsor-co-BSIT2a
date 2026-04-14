import express from "express";
import { register, login, sendOtp } from "../controllers/authController.js";

const router = express.Router();


router.post("/send-otp", sendOtp);
router.post("/register", register);
router.post("/login", login);

export default router;