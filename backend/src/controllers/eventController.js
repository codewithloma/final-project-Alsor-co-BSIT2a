import Event from "../models/EventModel.js";
import CBO from "../models/CboModel.js";
import User from "../models/UserModel.js";

// CREATE EVENT (ORG-BASED)
export const createEvent = async (req, res) => {
  try {
    const { org_id, event_title, event_desc, event_date } = req.body;

    const org = await CBO.findById(org_id);
    if (!org) return res.status(404).json({ message: "Organization not found" });

    const user = await User.findById(req.user.id);

    // must be officer/admin AND member of org
    const isMember = org.members.find(
      m => m.user_id.toString() === req.user.id && m.status === "approved"
    );

    if (!isMember || (user.user_type !== "officer" && user.user_type !== "admin")) {
      return res.status(403).json({ message: "Not allowed to create event" });
    }

    const event = await Event.create({
      org_id,
      event_title,
      event_desc,
      event_date
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET EVENTS PER ORGANIZATION
export const getOrgEvents = async (req, res) => {
  try {
    const events = await Event.find({ org_id: req.params.orgId }).sort({
      event_date: 1,
    });

    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};