import express from "express";
import { createEvent, getOrgEvents } from "../controllers/eventController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createEvent);
router.get("/org/:orgId", getOrgEvents);

export default router;