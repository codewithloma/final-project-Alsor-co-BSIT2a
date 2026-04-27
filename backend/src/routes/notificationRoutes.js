import express from "express";
import {
  getNotifications,
  markAsRead,
  getUnreadCount, 
} from "../controllers/notificationController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getNotifications);
router.get("/count", authMiddleware, getUnreadCount);
router.put("/:id/read", authMiddleware, markAsRead);

export default router;