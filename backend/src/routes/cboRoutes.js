// routes/cboRoutes.js
import express from "express";
import {
  createOrganization, // ADDED THIS
  getOrganizations,
  getOrganizationById,
  joinOrganization,
  leaveOrganization,
  getPendingMembers,
  approveMember,
  rejectMember,
} from "../controllers/cboController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public
router.get("/",    getOrganizations);
router.get("/:id", getOrganizationById);

// Member actions — must be logged in
router.post("/",          authMiddleware, createOrganization); // ADDED THIS: For saving the Cloudinary logo
router.post("/:id/join",  authMiddleware, joinOrganization);
router.post("/:id/leave", authMiddleware, leaveOrganization);

// Admin — member management
router.get("/:id/pending",                    authMiddleware, getPendingMembers);
router.patch("/:id/members/:userId/approve",  authMiddleware, approveMember);
router.delete("/:id/members/:userId",         authMiddleware, rejectMember);

export default router;