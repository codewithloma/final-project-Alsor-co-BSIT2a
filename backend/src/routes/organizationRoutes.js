import express from "express";
import {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  joinOrganization,
  approveMember,
  leaveOrganization
} from "../controllers/organizationController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// CRUD
router.post("/", authMiddleware, createOrganization);
router.get("/", getOrganizations);
router.get("/:id", getOrganizationById);

// membership
router.post("/:id/join", authMiddleware, joinOrganization);
router.post("/:orgId/approve/:userId", authMiddleware, approveMember);
router.post("/:id/leave", authMiddleware, leaveOrganization);

export default router;