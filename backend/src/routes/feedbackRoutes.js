import express from "express";
import { submitFeedback, getDeptFeedback } from "../controllers/feedbackController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Only logged-in users can submit feedback
router.post("/", authMiddleware, submitFeedback);

// Get feedback for a specific department
router.get("/dept/:deptId", authMiddleware, getDeptFeedback);

export default router;