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
      default: "",
    },

    media: {
      url: { type: String, default: null },
      type: {
        type: String,
        enum: ["image", "video", null],
        default: null,
      },
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

    org_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CBO",
      default: null,
    },

    reactions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],

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