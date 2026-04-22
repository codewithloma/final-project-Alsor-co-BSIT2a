import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // receiver
    },

    from_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      enum: [
        "reaction",
        "comment",
        "share",
        "event",
        "organization",
      ],
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    related_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    is_read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", NotificationSchema);