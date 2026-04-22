import CBOOfficer from "../models/CboOfficerModel.js";
import CBO from "../models/CboModel.js";
import User from "../models/UserModel.js";

// ---------------- CREATE ORGANIZATION ----------------
export const createOrganization = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔐 ONLY PRESIDENT CAN CREATE ORG
    const officerRecord = await CBOOfficer.findOne({
      user_id: user._id,
      officer_role: "president",
    });

    if (!officerRecord && user.user_type !== "admin") {
      return res.status(403).json({
        message: "Only organization president or admin can create organizations",
      });
    }

    const { org_name, acronym, description, logo_url, department } = req.body;

    const org = await CBO.create({
      org_name,
      acronym,
      description,
      logo_url,
      department,
      created_by: user._id,
      members: [
        {
          user_id: user._id,
          role: "president",
          status: "approved",
        },
      ],
    });

    // 🔥 ALSO CREATE OFFICER ENTRY FOR PRESIDENT
    await CBOOfficer.create({
      user_id: user._id,
      org_id: org._id,
      officer_role: "president",
      display_name: user.display_name,
    });

    res.status(201).json(org);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---------------- GET ALL ORGANIZATIONS (WITH FILTER FIX) ----------------
export const getOrganizations = async (req, res) => {
  try {
    const { department, search } = req.query;

    let query = {};

    if (department && department !== "all") {
      query.department = department;
    }

    if (search) {
      query.org_name = { $regex: search, $options: "i" };
    }

    const orgs = await CBO.find(query)
      .populate("created_by", "username display_name")
      .populate("members.user_id", "username display_name");

    res.json(orgs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---------------- GET SINGLE ORGANIZATION ----------------
export const getOrganizationById = async (req, res) => {
  try {
    const org = await CBO.findById(req.params.id)
      .populate("created_by", "username display_name")
      .populate("members.user_id", "username display_name");

    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    res.json(org);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---------------- JOIN ORGANIZATION (SAFE FIXED) ----------------
export const joinOrganization = async (req, res) => {
  try {
    const org = await CBO.findById(req.params.id);

    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const existing = org.members.find(
      m => m.user_id.toString() === req.user.id
    );

    if (existing) {
      return res.status(400).json({
        message: `Already ${existing.status === "pending" ? "requested" : "a member"}`
      });
    }

    org.members.push({
      user_id: req.user.id,
      role: "member",
      status: "pending"
    });

    await org.save();

    res.json({ message: "Join request sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ---------------- APPROVE MEMBER (SECURITY FIXED) ----------------
export const approveMember = async (req, res) => {
  try {
    const { orgId, userId } = req.params;

    // 🔐 check if requester is officer of org
    const requesterRole = await CBOOfficer.findOne({
      user_id: req.user.id,
      org_id: orgId,
    });

    if (!requesterRole || requesterRole.officer_role === "member") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const org = await CBO.findById(orgId);

    if (!org) return res.status(404).json({ message: "Organization not found" });

    const member = org.members.find(
      (m) => m.user_id.toString() === userId
    );

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // prevent double approval bug
    if (member.status === "approved") {
      return res.status(400).json({ message: "Already approved" });
    }

    member.status = "approved";

    await User.findByIdAndUpdate(userId, {
      organization: orgId,
    });

    await org.save();

    res.json({ message: "Member approved" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---------------- LEAVE ORGANIZATION (SAFE FIX) ----------------
export const leaveOrganization = async (req, res) => {
  try {
    const org = await CBO.findById(req.params.id);

    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    org.members = org.members.filter(
      m => m.user_id.toString() !== req.user.id
    );

    await User.findByIdAndUpdate(req.user.id, {
      organization: null
    });

    await org.save();

    res.json({ message: "Left organization" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};