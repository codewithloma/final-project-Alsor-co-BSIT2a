import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  date_posted: { type: Date, default: Date.now },
});

export default mongoose.model("Post", PostSchema);