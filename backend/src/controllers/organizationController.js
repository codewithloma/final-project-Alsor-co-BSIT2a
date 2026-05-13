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

    const userId = req.user.id || req.user._id;

    const existing = org.members.find((m) => {
      if (!m || !m.user_id) return false;
      return String(m.user_id) === String(userId);
    });

    if (existing) {
      return res.status(400).json({
        message: `Already ${existing.status === "pending" ? "requested" : "a member"}`
      });
    }

    org.members.push({
      user_id: userId,
      role: "member",
      status: "pending"
    });

    await org.save();

    res.json({ message: "Join request sent" });
  } catch (error) {
    console.error("Join organization error:", error);
    res.status(500).json({ message: error.message });
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

// ---------------- GET PENDING MEMBERS ----------------
export const getPendingMembers = async (req, res) => {
  try {
    const { orgId } = req.params;

    // check authorization
    const requesterRole = await CBOOfficer.findOne({
      user_id: req.user.id,
      org_id: orgId,
    });

    if (
      !requesterRole &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    const org = await CBO.findById(orgId)
      .populate(
        "members.user_id",
        "username display_name email student_id avatar_url"
      );

    if (!org) {
      return res.status(404).json({
        message: "Organization not found",
      });
    }

    const pendingMembers = org.members.filter(
      member => member.status === "pending"
    );

    res.json(pendingMembers);

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// ---------------- REJECT MEMBER ----------------
export const rejectMember = async (req, res) => {
  try {
    const { orgId, userId } = req.params;

    // check requester role
    const requesterRole = await CBOOfficer.findOne({
      user_id: req.user.id,
      org_id: orgId,
    });

    if (
      !requesterRole &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    const org = await CBO.findById(orgId);

    if (!org) {
      return res.status(404).json({
        message: "Organization not found",
      });
    }

    const memberIndex = org.members.findIndex(
      m => m.user_id.toString() === userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    // remove member request
    org.members.splice(memberIndex, 1);

    await org.save();

    res.json({
      message: "Member request rejected",
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// ---------------- GET APPROVED MEMBERS ----------------
export const getApprovedMembers = async (req, res) => {
  try {
    const { orgId } = req.params;

    const org = await CBO.findById(orgId)
      .populate(
        "members.user_id",
        "username display_name email avatar_url"
      );

    if (!org) {
      return res.status(404).json({
        message: "Organization not found",
      });
    }

    const approvedMembers = org.members.filter(
      member => member.status === "approved"
    );

    res.json(approvedMembers);

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// ---------------- LEAVE ORGANIZATION (SAFE FIX) ----------------
export const leaveOrganization = async (req, res) => {
  try {
    const org = await CBO.findById(req.params.id);

    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const userId = req.user.id || req.user._id;

    org.members = org.members.filter((m) => {
      if (!m || !m.user_id) return false;
      return String(m.user_id) !== String(userId);
    });

    await User.findByIdAndUpdate(userId, {
      organization: null
    });

    await org.save();

    res.json({ message: "Left organization" });
  } catch (error) {
    console.error("Leave organization error:", error);
    res.status(500).json({ message: error.message });
  }
};