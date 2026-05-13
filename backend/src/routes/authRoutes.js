import express from "express";
import { 
  register, 
  login, 
  sendOtp, 
  changePassword, 
  deleteAccount 
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/register", register);
router.post("/login", login);
router.post('/change-password', authMiddleware, changePassword);
router.delete('/delete-account', authMiddleware, deleteAccount);

export default router;