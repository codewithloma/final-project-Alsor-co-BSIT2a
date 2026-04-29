import express from "express";
import { 
  getProfile, 
  updateProfile, 
  getUserProfileById,
  getUserPosts 
} from "../controllers/profileController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getProfile);
router.put("/", authMiddleware, updateProfile);
router.get("/user/:id", authMiddleware, getUserProfileById);
router.get("/user/:id/posts", authMiddleware, getUserPosts);

// VIEW OTHER USER PROFILE
router.get("/user/:id", authMiddleware, getUserProfileById);

export default router;