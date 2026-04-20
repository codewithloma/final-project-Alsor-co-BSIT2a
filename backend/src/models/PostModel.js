import mongoose from "mongoose";

// ---------------- COMMENT SCHEMA ----------------
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

// ---------------- POST SCHEMA ----------------
const PostSchema = new mongoose.Schema(
  {
    // Owner of the post
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Main content
    content: {
      type: String,
      required: true,
    },

    //  Digital Letter Features
    design_template: {
      type: String,
      default: null,
    },

    //  Spotify integration
    spotify_track_url: {
      type: String,
      default: null,
    },

    //  Anonymous posting
    is_anonymous: {
      type: Boolean,
      default: false,
    },

    //  Reactions (likes)
    reactions: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    // unique: true,
  },
],

    //  Comments
    comments: [CommentSchema],

    //  Sharing (reference to original post)
    shared_from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

export default mongoose.model("Post", PostSchema);