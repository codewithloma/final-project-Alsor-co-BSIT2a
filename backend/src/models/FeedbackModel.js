import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dept_id: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
  content: { type: String, required: true },
  is_anonymous: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Feedback", FeedbackSchema);