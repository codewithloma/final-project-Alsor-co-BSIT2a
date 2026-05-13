import CBO from "../models/CboModel.js";

// @desc    Create a new organization (Saves Cloudinary URL)
// @route   POST /api/organization
export const createOrganization = async (req, res) => {
  try {
    const { org_name, acronym, description, logo_url, department } = req.body;

    // Basic validation to ensure required fields match your Model
    if (!org_name || !department) {
      return res.status(400).json({ message: "Organization name and Department are required." });
    }

    const newOrg = new CBO({
      org_name,
      acronym,
      description,
      logo_url, // This is your tsa.webp link from Cloudinary
      department,
      created_by: req.user.id || req.user._id,
    });

    const savedOrg = await newOrg.save();
    res.status(201).json(savedOrg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get all organizations with filters
// @route   GET /api/organization
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

// @desc    Get single organization by ID
// @route   GET /api/organization/:id
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

// @desc    Join an organization
// @route   POST /api/organization/:id/join
export const joinOrganization = async (req, res) => {
  try {
    const org = await CBO.findById(req.params.id);
    if (!org) return res.status(404).json({ message: "Organization not found" });

    const userId = (req.user.id || req.user._id).toString();

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

    res.json({ message: "Join request sent!", org: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Leave an organization
// @route   POST /api/organization/:id/leave
export const leaveOrganization = async (req, res) => {
  try {
    const org = await CBO.findById(req.params.id);
    if (!org) return res.status(404).json({ message: "Organization not found" });

    const userId = (req.user.id || req.user._id).toString();
    const before = org.members.length;

    org.members = org.members.filter(
      (m) => m.user_id?.toString() !== userId
    );

    if (org.members.length === before) {
      return res.status(400).json({ message: "You are not a member." });
    }

    await org.save();
    res.json({ message: "You have left the organization." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- ADMIN MANAGEMENT ---

export const getPendingMembers = async (req, res) => {
  try {
    const org = await CBO.findById(req.params.id)
      .populate("members.user_id", "username display_name email");

    if (!org) return res.status(404).json({ message: "Organization not found" });

    const pending = org.members.filter(m => m.status === "pending");
    res.json({ pending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const approveMember = async (req, res) => {
  try {
    const org = await CBO.findById(req.params.id);
    if (!org) return res.status(404).json({ message: "Organization not found" });

    const member = org.members.find(
      m => m.user_id?.toString() === req.params.userId
    );
    if (!member) return res.status(404).json({ message: "Member not found" });

    member.status = "approved";
    await org.save();

    res.json({ message: "Member approved", member });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const rejectMember = async (req, res) => {
  try {
    const org = await CBO.findById(req.params.id);
    if (!org) return res.status(404).json({ message: "Organization not found" });

    org.members = org.members.filter(
      m => m.user_id?.toString() !== req.params.userId
    );
    await org.save();

    res.json({ message: "Member removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};