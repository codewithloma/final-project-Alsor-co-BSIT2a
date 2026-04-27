import express from "express";
import {
  createPost,
  getPosts,
  getPostById,
  reactToPost,
  addComment,
  sharePost,
  updatePost,
  deletePost,
  searchSpotify
} from "../controllers/postsController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createPost);
router.get("/", getPosts);

 
router.get("/spotify/search", searchSpotify);
router.get("/:id", authMiddleware, getPostById);
router.post("/:id/react", authMiddleware, reactToPost);
router.post("/:id/comment", authMiddleware, addComment);
router.post("/:id/share", authMiddleware, sharePost);
router.put("/:id", authMiddleware, updatePost);
router.delete("/:id", authMiddleware, deletePost);


export default router;