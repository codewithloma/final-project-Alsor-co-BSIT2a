import express from "express";
import {
  assignOfficer,
  getOrgOfficers,
} from "../controllers/cboOfficerController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/assign", authMiddleware, assignOfficer);
router.get("/org/:orgId", getOrgOfficers);

export default router;