import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
  org_id: { type: mongoose.Schema.Types.ObjectId, ref: "CBO", required: true },
  event_title: { type: String, required: true },
  event_desc: { type: String },
  event_date: { type: Date, required: true },
}, { timestamps: true });

export default mongoose.model("Event", EventSchema);