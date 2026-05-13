import express from "express";
import {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  joinOrganization,
  approveMember,
  rejectMember,
  getPendingMembers,
  getApprovedMembers,
  leaveOrganization
} from "../controllers/organizationController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createOrganization);
router.get("/", getOrganizations);
router.get("/:id", getOrganizationById);

router.post("/:id/join", authMiddleware, joinOrganization);
router.post("/:id/leave", authMiddleware, leaveOrganization);

router.get("/:orgId/pending-members", authMiddleware, getPendingMembers);
router.get("/:orgId/members", authMiddleware, getApprovedMembers);

router.post("/:orgId/approve/:userId", authMiddleware, approveMember);
router.delete("/:orgId/reject/:userId", authMiddleware, rejectMember);

export default router;