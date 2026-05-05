// routes/cboRoutes.js
import express from "express";
import {
  getOrganizations,
  getOrganizationById,
  joinOrganization,
  leaveOrganization,
} from "../controllers/cboController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public
router.get("/",    getOrganizations);
router.get("/:id", getOrganizationById);

// Protected — need to be logged in
router.post("/:id/join",  authMiddleware, joinOrganization);
router.post("/:id/leave", authMiddleware, leaveOrganization);

export default router;