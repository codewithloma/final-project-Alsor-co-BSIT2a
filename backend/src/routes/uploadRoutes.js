import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { uploadAvatar, uploadPostMedia } from "../controllers/uploadController.js";

const router = express.Router();

router.post("/avatar", authMiddleware, uploadAvatar);
router.post("/post-media", authMiddleware, uploadPostMedia);

export default router;