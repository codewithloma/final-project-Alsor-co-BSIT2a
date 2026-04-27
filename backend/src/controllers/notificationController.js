import Notification from "../models/NotificationModel.js";

// GET USER NOTIFICATIONS
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user_id: req.user.id,
    })
      .populate("from_user", "username display_name avatar_url")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// MARK AS READ
export const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      is_read: true,
    });

    res.json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
//Notification Indicator
export const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      user_id: req.user.id,
      is_read: false
    });
    
    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};