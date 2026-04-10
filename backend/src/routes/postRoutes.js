import express from "express";
import {
  createPost,
  getPosts,
  reactToPost,
  addComment,
  sharePost,
  updatePost,
  deletePost
} from "../controllers/postsController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Only logged-in users can create, react, comment, update, delete
router.post("/", authMiddleware, createPost);
router.get("/", getPosts);
router.post("/:id/react", authMiddleware, reactToPost);
router.post("/:id/comment", authMiddleware, addComment);
router.post("/:id/share", authMiddleware, sharePost);
router.put("/:id", authMiddleware, updatePost);
router.delete("/:id", authMiddleware, deletePost);

export default router;