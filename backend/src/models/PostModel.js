import mongoose from "mongoose";

// ---------------- COMMENT ----------------
const CommentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// ---------------- POST ----------------
const PostSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    design_template: {
      type: String,
      default: null,
    },

    spotify_track_url: {
      type: String,
      default: null,
    },

    is_anonymous: {
      type: Boolean,
      default: false,
    },

    // ⭐ ORGANIZATION FEED SUPPORT
    org_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CBO",
      default: null,
    },

    reactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    comments: [CommentSchema],

    shared_from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Post", PostSchema);