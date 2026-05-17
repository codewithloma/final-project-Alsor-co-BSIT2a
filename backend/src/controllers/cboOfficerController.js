import CBOOfficer from "../models/CboOfficerModel.js";
import CBO from "../models/CboModel.js";
import User from "../models/UserModel.js";

// ---------------- ASSIGN OFFICER ROLE ----------------
// ONLY admin can assign officers.
// ✅ Also promotes the user's user_type to "officer" so they
//    can access the admin dashboard immediately after login.
export const assignOfficer = async (req, res) => {
  try {
    const { user_id, org_id, officer_role } = req.body;

    const admin = await User.findById(req.user.id);

if (!admin || admin.user_type !== "admin") {
      return res.status(403).json({ message: "Only admin can assign officers" });
    }

    const org  = await CBO.findById(org_id);
    const user = await User.findById(user_id);

    if (!org || !user) {
      return res.status(404).json({ message: "User or Organization not found" });
    }


    // Prevent duplicate officer assignment
    const existing = await CBOOfficer.findOne({ user_id, org_id });
    if (existing) {
      return res.status(400).json({ message: "User already an officer in this org" });
    }

    const officer = await CBOOfficer.create({
      user_id,
      org_id,
      officer_role,
      display_name: user.display_name || user.username,
    });

    // ✅ Promote user_type so the assigned account can access the admin dashboard.
    // Only upgrade student → officer. Don't downgrade an existing admin.
    if (user.user_type === "student") {
      await User.findByIdAndUpdate(user_id, { user_type: "officer" });
    }

    res.status(201).json(officer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---------------- GET OFFICERS OF ORG ----------------
export const getOrgOfficers = async (req, res) => {
  try {
    const officers = await CBOOfficer.find({
      org_id: req.params.orgId,
    }).populate("user_id", "username display_name");

    res.json(officers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};