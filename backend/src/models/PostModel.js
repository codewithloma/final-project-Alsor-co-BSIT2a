import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },

    // New Digital Letter features
    design_template: { type: String, default: "" },
    spotify_track_url: { type: String, default: "" },

    // New anonymity
    is_anonymous: { type: Boolean, default: false },

    // Social features
    reactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [CommentSchema],
    shared_from: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },

  },
  { timestamps: true }
);

export default mongoose.model("Post", PostSchema);