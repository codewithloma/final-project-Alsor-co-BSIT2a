import { validationResult } from 'express-validator';
import Event from '../models/EventModel.js';

// ─── Helpers ─────────────────────────────────────────────
const buildFilter = (query) => {
  const filter = { is_cancelled: false };

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const weekEnd    = new Date(todayStart.getTime() + 7 * 24 * 3600 * 1000);

  // Status filter
  if (query.status === 'upcoming') filter.date = { $gt: todayEnd };
  else if (query.status === 'today') filter.date = { $gte: todayStart, $lte: todayEnd };
  else if (query.status === 'past')  filter.date = { $lt: todayStart };
  else if (query.status === 'soon')  filter.date = { $gte: todayStart, $lte: weekEnd };

  // Org filter
  if (query.org_id) filter.org_id = query.org_id;

  // Event type
  if (query.event_type) filter.event_type = query.event_type;

  // Text search (title / content)
  if (query.search) {
    filter.$or = [
      { title:   { $regex: query.search, $options: 'i' } },
      { content: { $regex: query.search, $options: 'i' } },
      { venue:   { $regex: query.search, $options: 'i' } },
    ];
  }

  return filter;
};

// ─── GET /api/events ──────────────────────────────────────
// Chronological list with filter / search / sort / pagination
export const getEvents = async (req, res, next) => {
  try {
    const filter = buildFilter(req.query);

    // sort: asc = oldest first (default for upcoming), desc = newest first
    const sortDir = req.query.sort === 'desc' ? -1 : 1;

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('org_id', 'org_name acronym logo_url color')
        .sort({ date: sortDir, createdAt: sortDir })
        .skip(skip)
        .limit(limit),
      Event.countDocuments(filter),
    ]);

    // Attach whether the requesting user has RSVP'd
    const userId = req.user?._id?.toString();
    const data = events.map((ev) => {
      const obj = ev.toJSON();
      obj.is_going = userId ? ev.rsvp_users.some((id) => id.toString() === userId) : false;
      return obj;
    });

    res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/events/:id ──────────────────────────────────
export const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('org_id', 'org_name acronym logo_url color description');

    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    const obj = event.toJSON();
    const userId = req.user?._id?.toString();
    obj.is_going = userId ? event.rsvp_users.some((id) => id.toString() === userId) : false;

    res.json({ success: true, data: obj });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/events ─────────────────────────────────────
// CBO officers and admins only
export const createEvent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { org_id, title, content, date, time, venue, event_type, banner_url } = req.body;

    const event = await Event.create({ org_id, title, content, date, time, venue, event_type, banner_url });
    await event.populate('org_id', 'org_name acronym logo_url color');

    res.status(201).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/events/:id ──────────────────────────────────
export const updateEvent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const allowed = ['title', 'content', 'date', 'time', 'venue', 'event_type', 'banner_url', 'is_cancelled'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const event = await Event.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true,
    }).populate('org_id', 'org_name acronym logo_url color');

    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/events/:id ───────────────────────────────
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    res.json({ success: true, message: 'Event deleted.' });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/events/:id/rsvp ────────────────────────────
// Toggle RSVP for the authenticated user
export const toggleRSVP = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    if (event.is_cancelled) {
      return res.status(400).json({ success: false, message: 'Cannot RSVP to a cancelled event.' });
    }

    const now = new Date();
    if (new Date(event.date) < now) {
      return res.status(400).json({ success: false, message: 'Cannot RSVP to a past event.' });
    }

    const userId = req.user._id;
    const idx = event.rsvp_users.findIndex((id) => id.toString() === userId.toString());

    let going;
    if (idx === -1) {
      event.rsvp_users.push(userId);
      going = true;
    } else {
      event.rsvp_users.splice(idx, 1);
      going = false;
    }

    await event.save();

    res.json({
      success: true,
      going,
      rsvp_count: event.rsvp_users.length,
      message: going ? "You're going!" : 'RSVP removed.',
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/events/stats ────────────────────────────────
// Summary counts used by the stats strip in the UI
export const getEventStats = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);

    const [total, upcoming, today, past, going] = await Promise.all([
      Event.countDocuments({ is_cancelled: false }),
      Event.countDocuments({ is_cancelled: false, date: { $gt: todayEnd } }),
      Event.countDocuments({ is_cancelled: false, date: { $gte: todayStart, $lte: todayEnd } }),
      Event.countDocuments({ is_cancelled: false, date: { $lt: todayStart } }),
      req.user
        ? Event.countDocuments({ is_cancelled: false, rsvp_users: req.user._id })
        : Promise.resolve(0),
    ]);

    res.json({ success: true, data: { total, upcoming: upcoming + today, today, past, going } });
  } catch (err) {
    next(err);
  }
};