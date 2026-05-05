// controllers/cboController.js
import CBO from "../models/CboModel.js";

// GET /api/organization
export const getOrganizations = async (req, res) => {
  try {
    const { department, search } = req.query;
    const filter = {};

    if (department && department !== "all") {
      filter.department = department;
    }

    if (search) {
      filter.$or = [
        { org_name:    { $regex: search, $options: "i" } },
        { acronym:     { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const orgs = await CBO.find(filter)
      .populate("created_by", "username display_name")
      .populate("members.user_id", "username display_name")
      .sort({ createdAt: -1 });

    res.json(orgs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/organization/:id
export const getOrganizationById = async (req, res) => {
  try {
    const org = await CBO.findById(req.params.id)
      .populate("created_by", "username display_name")
      .populate("members.user_id", "username display_name");

    if (!org) return res.status(404).json({ message: "Organization not found" });

    res.json(org);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/organization/:id/join
export const joinOrganization = async (req, res) => {
  try {
    const org = await CBO.findById(req.params.id);
    if (!org) return res.status(404).json({ message: "Organization not found" });

    const userId = req.user.id; // comes from authMiddleware → jwt decoded

    const existing = org.members.find(
      (m) => m.user_id?.toString() === userId
    );

    if (existing) {
      const msg =
        existing.status === "approved"
          ? "You are already a member."
          : "Your request is already pending.";
      return res.status(400).json({ message: msg });
    }

    org.members.push({ user_id: userId, role: "member", status: "pending" });
    await org.save();

    const updated = await CBO.findById(req.params.id)
      .populate("created_by", "username display_name")
      .populate("members.user_id", "username display_name");

    res.json({ message: "Join request sent! Waiting for approval.", org: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/organization/:id/leave
export const leaveOrganization = async (req, res) => {
  try {
    const org = await CBO.findById(req.params.id);
    if (!org) return res.status(404).json({ message: "Organization not found" });

    const userId = req.user.id;
    const before = org.members.length;

    org.members = org.members.filter(
      (m) => m.user_id?.toString() !== userId
    );

    if (org.members.length === before) {
      return res.status(400).json({ message: "You are not a member of this organization." });
    }

    await org.save();
    res.json({ message: "You have left the organization." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};